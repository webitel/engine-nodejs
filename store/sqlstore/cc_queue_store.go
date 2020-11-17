package sqlstore

import (
	"fmt"
	"github.com/lib/pq"
	"github.com/webitel/engine/auth_manager"
	"github.com/webitel/engine/model"
	"github.com/webitel/engine/store"
	"net/http"
)

type SqlQueueStore struct {
	SqlStore
}

func NewSqlQueueStore(sqlStore SqlStore) store.QueueStore {
	us := &SqlQueueStore{sqlStore}
	return us
}

func (s SqlQueueStore) CheckAccess(domainId, id int64, groups []int, access auth_manager.PermissionAccess) (bool, *model.AppError) {

	res, err := s.GetReplica().SelectNullInt(`select 1
		where exists(
          select 1
          from cc_queue_acl a
          where a.dc = :DomainId
            and a.object = :Id
            and a.subject = any (:Groups::int[])
            and a.access & :Access = :Access
        )`, map[string]interface{}{"DomainId": domainId, "Id": id, "Groups": pq.Array(groups), "Access": access.Value()})

	if err != nil {
		return false, nil
	}

	return (res.Valid && res.Int64 == 1), nil
}

func (s SqlQueueStore) Create(queue *model.Queue) (*model.Queue, *model.AppError) {
	var out *model.Queue
	if err := s.GetMaster().SelectOne(&out, `with q as (
    insert into cc_queue (strategy, enabled, payload, calendar_id, priority, updated_at,
                      name, variables, timeout, domain_id, dnc_list_id, sec_locate_agent, type, team_id,
                      created_at, created_by, updated_by, description, ringtone_id, schema_id, do_schema_id, after_schema_id)
values (:Strategy, :Enabled, :Payload, :CalendarId, :Priority, :UpdatedAt, :Name,
        :Variables, :Timeout, :DomainId, :DncListId, :SecLocateAgent, :Type, :TeamId, :CreatedAt, :CreatedBy, :UpdatedBy, :Description, :RingtoneId,
		:SchemaId, :DoSchemaId, :AfterSchemaId)
    returning *
)
select q.id,
       q.strategy,
       q.enabled,
       q.payload,
       q.priority,
       q.updated_at,
       q.name,
       q.variables,
       q.timeout,
       q.domain_id,
       q.sec_locate_agent,
       q.type,
       q.created_at,
       cc_get_lookup(uc.id, uc.name)         as created_by,
       cc_get_lookup(u.id, u.name)           as updated_by,
       cc_get_lookup(c.id, c.name)           as calendar,
       cc_get_lookup(cl.id, cl.name)         as dnc_list,
       cc_get_lookup(ct.id, ct.name)         as team,
       q.description,
       cc_get_lookup(s.id, s.name)           as schema,
       call_center.cc_get_lookup(ds.id, ds.name)                      AS do_schema,
       call_center.cc_get_lookup(afs.id, afs.name)                      AS after_schema,
       cc_get_lookup(q.ringtone_id, mf.name) as ringtone
from q
         inner join flow.calendar c on q.calendar_id = c.id
         left join directory.wbt_user uc on uc.id = q.created_by
         left join directory.wbt_user u on u.id = q.updated_by
         left join cc_list cl on q.dnc_list_id = cl.id
         left join flow.acr_routing_scheme s on q.schema_id = s.id
         LEFT JOIN flow.acr_routing_scheme ds ON q.do_schema_id = ds.id
         LEFT JOIN flow.acr_routing_scheme afs ON q.after_schema_id = afs.id
         left join cc_team ct on q.team_id = ct.id
         left join storage.media_files mf on mf.id = q.ringtone_id`,
		map[string]interface{}{
			"Strategy":       queue.Strategy,
			"Enabled":        queue.Enabled,
			"Payload":        queue.Payload,
			"CalendarId":     queue.Calendar.Id,
			"Priority":       queue.Priority,
			"UpdatedAt":      queue.UpdatedAt,
			"Name":           queue.Name,
			"Variables":      queue.Variables.ToJson(),
			"Timeout":        queue.Timeout,
			"DomainId":       queue.DomainId,
			"DncListId":      queue.DncListId(),
			"SecLocateAgent": queue.SecLocateAgent,
			"Type":           queue.Type,
			"TeamId":         queue.TeamId(),
			"CreatedAt":      queue.CreatedAt,
			"CreatedBy":      queue.CreatedBy.Id,
			"UpdatedBy":      queue.UpdatedBy.Id,
			"Description":    queue.Description,
			"SchemaId":       queue.SchemaId(),
			"DoSchemaId":     queue.DoSchemaId(),
			"AfterSchemaId":  queue.AfterSchemaId(),
			"RingtoneId":     queue.RingtoneId(),
		}); nil != err {
		return nil, model.NewAppError("SqlQueueStore.Save", "store.sql_queue.save.app_error", nil,
			fmt.Sprintf("name=%v, %v", queue.Name, err.Error()), extractCodeFromErr(err))
	} else {
		return out, nil
	}
}

func (s SqlQueueStore) GetAllPage(domainId int64, search *model.SearchQueue) ([]*model.Queue, *model.AppError) {
	var queues []*model.Queue

	f := map[string]interface{}{
		"DomainId": domainId,
		"Ids":      pq.Array(search.Ids),
		"Q":        search.GetQ(),
	}

	err := s.ListQuery(&queues, search.ListRequest,
		`domain_id = :DomainId and ( (:Ids::int[] isnull or id = any(:Ids) )  and (:Q::varchar isnull or (name ilike :Q::varchar or description ilike :Q::varchar ) ))`,
		model.Queue{}, f)
	if err != nil {
		return nil, model.NewAppError("SqlQueueStore.GetAllPage", "store.sql_queue.get_all.app_error", nil, err.Error(), http.StatusInternalServerError)
	}

	return queues, nil
}

func (s SqlQueueStore) GetAllPageByGroups(domainId int64, groups []int, search *model.SearchQueue) ([]*model.Queue, *model.AppError) {
	var queues []*model.Queue

	f := map[string]interface{}{
		"Groups":   pq.Array(groups),
		"Access":   auth_manager.PERMISSION_ACCESS_READ.Value(),
		"DomainId": domainId,
		"Ids":      pq.Array(search.Ids),
		"Q":        search.GetQ(),
	}

	err := s.ListQuery(&queues, search.ListRequest,
		`domain_id = :DomainId and  (
					exists(select 1
					  from cc_queue_acl acl
					  where acl.dc = t.domain_id and acl.object = t.id and acl.subject = any(:Groups::int[]) and acl.access&:Access = :Access)
		  	) and ( (:Ids::int[] isnull or id = any(:Ids) )  and (:Q::varchar isnull or (name ilike :Q::varchar or description ilike :Q::varchar ) ))`,
		model.Queue{}, f)
	if err != nil {
		return nil, model.NewAppError("SqlQueueStore.GetAllPageByGroups", "store.sql_queue.get_all.app_error", nil, err.Error(), http.StatusInternalServerError)
	}

	return queues, nil
}

func (s SqlQueueStore) Get(domainId int64, id int64) (*model.Queue, *model.AppError) {
	var queue *model.Queue
	if err := s.GetReplica().SelectOne(&queue, `
select q.id,
       q.strategy,
       q.enabled,
       q.payload,
       q.priority,
       q.updated_at,
       q.name,
       q.variables,
       q.timeout,
       q.domain_id,
       q.sec_locate_agent,
       q.type,
       q.created_at,
       cc_get_lookup(uc.id, uc.name)         as created_by,
       cc_get_lookup(u.id, u.name)           as updated_by,
       cc_get_lookup(c.id, c.name)           as calendar,
       cc_get_lookup(cl.id, cl.name)         as dnc_list,
       cc_get_lookup(ct.id, ct.name)         as team,
       q.description,
       cc_get_lookup(s.id, s.name)           as schema,
       call_center.cc_get_lookup(ds.id, ds.name)                      AS do_schema,
       call_center.cc_get_lookup(afs.id, afs.name)                      AS after_schema,
       cc_get_lookup(q.ringtone_id, mf.name) as ringtone
from cc_queue q
         inner join flow.calendar c on q.calendar_id = c.id
         left join directory.wbt_user uc on uc.id = q.created_by
         left join directory.wbt_user u on u.id = q.updated_by
         left join cc_list cl on q.dnc_list_id = cl.id
         left join flow.acr_routing_scheme s on q.schema_id = s.id
         LEFT JOIN flow.acr_routing_scheme ds ON q.do_schema_id = ds.id
         LEFT JOIN flow.acr_routing_scheme afs ON q.after_schema_id = afs.id
         left join cc_team ct on q.team_id = ct.id
         left join storage.media_files mf on mf.id = q.ringtone_id
where q.domain_id = :DomainId and q.id = :Id 	
		`, map[string]interface{}{"Id": id, "DomainId": domainId}); err != nil {
		return nil, model.NewAppError("SqlQueueStore.Get", "store.sql_queue.get.app_error", nil,
			fmt.Sprintf("Id=%v, %s", id, err.Error()), extractCodeFromErr(err))
	} else {
		return queue, nil
	}
}

func (s SqlQueueStore) Update(queue *model.Queue) (*model.Queue, *model.AppError) {
	err := s.GetMaster().SelectOne(&queue, `with q as (
    update cc_queue q
set updated_at = :UpdatedAt,
    updated_by = :UpdatedBy,
    strategy = :Strategy,
    enabled = :Enabled,
    payload = :Payload,
    calendar_id = :CalendarId,
    priority = :Priority,
    name = :Name,
    variables = :Variables,
    timeout = :Timeout,
    dnc_list_id = :DncListId,
    sec_locate_agent = :SecLocateAgent,
    type = :Type,
    team_id = :TeamId,
	description = :Description,
	schema_id = :SchemaId,
	ringtone_id = :RingtoneId,
	do_schema_id = :DoSchemaId,
	after_schema_id = :AfterSchemaId
where q.id = :Id and q.domain_id = :DomainId
    returning *
)
select q.id,
       q.strategy,
       q.enabled,
       q.payload,
       q.priority,
       q.updated_at,
       q.name,
       q.variables,
       q.timeout,
       q.domain_id,
       q.sec_locate_agent,
       q.type,
       q.created_at,
       cc_get_lookup(uc.id, uc.name)         as created_by,
       cc_get_lookup(u.id, u.name)           as updated_by,
       cc_get_lookup(c.id, c.name)           as calendar,
       cc_get_lookup(cl.id, cl.name)         as dnc_list,
       cc_get_lookup(ct.id, ct.name)         as team,
       q.description,
       cc_get_lookup(s.id, s.name)           as schema,
       call_center.cc_get_lookup(ds.id, ds.name)                      AS do_schema,
       call_center.cc_get_lookup(afs.id, afs.name)                      AS after_schema,
       cc_get_lookup(q.ringtone_id, mf.name) as ringtone
from q
         inner join flow.calendar c on q.calendar_id = c.id
         left join directory.wbt_user uc on uc.id = q.created_by
         left join directory.wbt_user u on u.id = q.updated_by
         left join cc_list cl on q.dnc_list_id = cl.id
         left join flow.acr_routing_scheme s on q.schema_id = s.id
         LEFT JOIN flow.acr_routing_scheme ds ON q.do_schema_id = ds.id
         LEFT JOIN flow.acr_routing_scheme afs ON q.after_schema_id = afs.id
         left join cc_team ct on q.team_id = ct.id
         left join storage.media_files mf on mf.id = q.ringtone_id`, map[string]interface{}{
		"UpdatedAt":      queue.UpdatedAt,
		"UpdatedBy":      queue.UpdatedBy.Id,
		"Strategy":       queue.Strategy,
		"Enabled":        queue.Enabled,
		"Payload":        queue.Payload,
		"CalendarId":     queue.Calendar.Id,
		"Priority":       queue.Priority,
		"Name":           queue.Name,
		"Variables":      queue.Variables.ToJson(),
		"Timeout":        queue.Timeout,
		"DncListId":      queue.DncListId(),
		"SecLocateAgent": queue.SecLocateAgent,
		"Type":           queue.Type,
		"TeamId":         queue.TeamId(),
		"SchemaId":       queue.SchemaId(),
		"Id":             queue.Id,
		"DomainId":       queue.DomainId,
		"Description":    queue.Description,
		"RingtoneId":     queue.RingtoneId(),
		"DoSchemaId":     queue.DoSchemaId(),
		"AfterSchemaId":  queue.AfterSchemaId(),
	})
	if err != nil {
		return nil, model.NewAppError("SqlQueueStore.Update", "store.sql_queue.update.app_error", nil,
			fmt.Sprintf("Id=%v, %s", queue.Id, err.Error()), extractCodeFromErr(err))
	}
	return queue, nil
}

func (s SqlQueueStore) Delete(domainId, id int64) *model.AppError {
	if _, err := s.GetMaster().Exec(`delete from cc_queue c where c.id=:Id and c.domain_id = :DomainId`,
		map[string]interface{}{"Id": id, "DomainId": domainId}); err != nil {
		return model.NewAppError("SqlQueueStore.Delete", "store.sql_queue.delete.app_error", nil,
			fmt.Sprintf("Id=%v, %s", id, err.Error()), http.StatusInternalServerError)
	}
	return nil
}

// FIXME RBAC
func (s SqlQueueStore) QueueReportGeneral(domainId int64, search *model.SearchQueueReportGeneral) ([]*model.QueueReportGeneral, *model.AppError) {
	var report []*model.QueueReportGeneral
	_, err := s.GetReplica().Select(&report, `
with queues  as  (
    select *
    from cc_queue q
    where q.enabled is true and q.domain_id = :DomainId
        and ( :QueueIds::int[] isnull or q.id = any(:QueueIds) )
        and ( :Types::int[] isnull or q.type = any(:Types) )
        and ( :TeamIds::int[] isnull or q.team_id = any(:TeamIds) )
        and (:Q::varchar isnull or (q.name ilike :Q::varchar ) )
),
     teams as (
         SELECT s.team_id,
                count(*) filter ( where a.status = 'online' ) online,
                count(*) filter ( where a.status = 'pause' )  pause
         FROM (SELECT aq.team_id,
                      sa.agent_id
               FROM call_center.cc_agent_in_team aq
                        JOIN call_center.cc_skill_in_agent sa ON sa.skill_id = aq.skill_id
                        LEFT JOIN LATERAL unnest(aq.bucket_ids) x(x) ON true
               WHERE aq.skill_id IS NOT NULL
                 AND sa.capacity >= aq.min_capacity
                 AND sa.capacity <= aq.max_capacity
               UNION
               SELECT aq.team_id,
                      aq.agent_id
               FROM call_center.cc_agent_in_team aq
                        LEFT JOIN LATERAL unnest(aq.bucket_ids) x(x) ON true
               WHERE aq.agent_id IS NOT NULL) s
                  inner join cc_agent a on a.id = s.agent_id
         where s.team_id in (
             select distinct queues.team_id
             from queues
         )
         GROUP BY 1
     )
select cc_get_lookup(q.id, q.name) queue,
       cc_get_lookup(ct.id, ct.name) team,
       coalesce(teams.online, 0) online,
       coalesce(teams.pause, 0) pause,
       case when q.type = 1 then (select count(*) from cc_member_attempt a1 where a1.queue_id = q.id and a1.bridged_at isnull)
           else (select sum(s.member_waiting) from cc_queue_statistics s where s.queue_id = q.id) end waiting,
       (select count(*) from cc_member_attempt a where a.queue_id = q.id and a.bridged_at notnull) processed,
       coalesce(ag.count, 0) count,
       coalesce(ag.bridged, 0) bridged,
       coalesce(ag.abandoned, 0) abandoned,
       coalesce(ag.sum_bill_sec, 0) sum_bill_sec,
       coalesce(ag.avg_wrap_sec, 0) avg_wrap_sec,
       coalesce(ag.avg_awt_sec, 0) avg_awt_sec,
       coalesce(ag.max_awt_sec, 0) max_awt_sec,
       coalesce(ag.avg_asa_sec, 0) avg_asa_sec,
       coalesce(ag.avg_aht_sec, 0) avg_aht_sec
from queues q
    left join teams on teams.team_id = q.team_id
    left join cc_team ct on q.team_id = ct.id
    left join lateral (
        select
               t.queue_id,
               count(*) as count,
               count(*) filter ( where t.bridged_at notnull ) * 100.0 / count(*) as bridged,
               count(*) filter ( where t.bridged_at isnull  ) * 100.0 / count(*) as abandoned,
               extract(EPOCH from sum(t.leaving_at - t.bridged_at) filter ( where t.bridged_at notnull )) sum_bill_sec,
               extract(EPOCH from avg(t.reporting_at - t.leaving_at) filter ( where t.reporting_at notnull )) avg_wrap_sec,
               extract(EPOCH from avg(t.bridged_at - t.offering_at) filter ( where t.bridged_at notnull )) avg_awt_sec,
               extract(epoch from max(t.bridged_at - t.offering_at) filter ( where t.bridged_at notnull )) max_awt_sec,
               extract(epoch from avg(t.bridged_at - t.joined_at) filter ( where t.bridged_at notnull )) avg_asa_sec,
               extract(epoch from avg( GREATEST(t.leaving_at, t.reporting_at) - t.bridged_at ) filter ( where t.bridged_at notnull )) avg_aht_sec
        from cc_member_attempt_history t
        where t.domain_id = :DomainId and t.joined_at between :From::timestamptz and :To::timestamptz
            and t.queue_id = q.id
        group by 1
) ag on true
order by q.priority desc
limit :Limit
offset :Offset
`, map[string]interface{}{
		"DomainId": domainId,
		"From":     model.GetBetweenFromTime(&search.JoinedAt),
		"To":       model.GetBetweenToTime(&search.JoinedAt),
		"Q":        search.GetQ(),
		"QueueIds": pq.Array(search.QueueIds),
		"TeamIds":  pq.Array(search.TeamIds),
		"Types":    pq.Array(search.Types),
		"Limit":    search.GetLimit(),
		"Offset":   search.GetOffset(),
	})

	if err != nil {
		return nil, model.NewAppError("SqlQueueStore.QueueReportGeneral", "store.sql_queue.report_general.app_error",
			nil, err.Error(), extractCodeFromErr(err))
	}

	return report, nil
}
