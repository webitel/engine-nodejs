package sqlstore

import (
	"fmt"
	"github.com/lib/pq"
	"github.com/webitel/engine/model"
	"github.com/webitel/engine/store"
)

type SqlQueueHookStore struct {
	SqlStore
}

func NewSqlQueueHookStore(sqlStore SqlStore) store.QueueHookStore {
	us := &SqlQueueHookStore{sqlStore}
	return us
}

func (s SqlQueueHookStore) Create(domainId int64, queueId uint32, in *model.QueueHook) (*model.QueueHook, *model.AppError) {
	var qh *model.QueueHook

	err := s.GetMaster().SelectOne(&qh, `with qe as (
    insert into cc_queue_events (schema_id, event, queue_id, enabled, updated_by, updated_at)
    select :SchemaId, :Event, :QueueId, :Enabled, :UpdatedBy, :UpdatedAt
    where exists (select 1 from cc_queue q where q.domain_id = :DomainId and q.id = :QueueId)
    returning *
)
select qe.id,
       cc_get_lookup(qe.schema_id, s.name) "schema",
       qe.event,
       qe.enabled
from qe
    left join flow.acr_routing_scheme s on s.id = qe.schema_id`, map[string]interface{}{
		"DomainId":  domainId,
		"SchemaId":  in.Schema.Id,
		"Event":     in.Event,
		"QueueId":   queueId,
		"Enabled":   in.Enabled,
		"UpdatedBy": in.UpdatedBy.Id,
		"UpdatedAt": in.UpdatedAt,
	})

	if err != nil {
		return nil, model.NewAppError("SqlQueueHookStore.Create", "store.sql_queue_hook.create.app_error", nil,
			fmt.Sprintf("event=%v, %v", in.Event, err.Error()), extractCodeFromErr(err))
	}

	return qh, nil
}

func (s SqlQueueHookStore) Get(domainId int64, queueId, id uint32) (*model.QueueHook, *model.AppError) {
	var qh *model.QueueHook

	err := s.GetReplica().SelectOne(&qh, `select
    id,
    schema,
    event,
    enabled
from cc_queue_events_list qe
where qe.queue_id = :QueueId
     and qe.id = :Id
     and exists (select 1 from cc_queue q where q.id = qe.queue_id and q.domain_id = :DomainId)`, map[string]interface{}{
		"QueueId":  queueId,
		"Id":       id,
		"DomainId": domainId,
	})

	if err != nil {
		return nil, model.NewAppError("SqlQueueHookStore.Get", "store.sql_queue_hook.get.app_error", nil,
			fmt.Sprintf("Id=%v, %v", id, err.Error()), extractCodeFromErr(err))
	}

	return qh, nil
}

func (s SqlQueueHookStore) GetAllPage(domainId int64, queueId uint32, search *model.SearchQueueHook) ([]*model.QueueHook, *model.AppError) {
	var list []*model.QueueHook

	f := map[string]interface{}{
		"DomainId":  domainId,
		"QueueId":   queueId,
		"Q":         search.GetQ(),
		"Ids":       pq.Array(search.Ids),
		"SchemaIds": pq.Array(search.SchemaIds),
		"Events":    pq.Array(search.Events),
	}

	err := s.ListQuery(&list, search.ListRequest,
		` queue_id = :QueueId::int
                and exists (select 1 from cc_queue q where q.id = queue_id and q.domain_id = :DomainId)
				and (:Q::text isnull or ( "event" ilike :Q::varchar ))
				and (:Ids::int4[] isnull or id = any(:Ids))
				and (:SchemaIds::int4[] isnull or schema_id = any(:SchemaIds))
				and (:Events::varchar[] isnull or "event" = any(:Events))
			`,
		model.QueueHook{}, f)
	if err != nil {
		return nil, model.NewAppError("SqlQueueHookStore.GetAllPage", "store.sql_queue_hook.get_all.app_error", nil, err.Error(), extractCodeFromErr(err))
	}

	return list, nil
}

func (s SqlQueueHookStore) Update(domainId int64, queueId uint32, qh *model.QueueHook) (*model.QueueHook, *model.AppError) {

	err := s.GetMaster().SelectOne(&qh, `with qe as (
    update cc_queue_events
    set schema_id = :SchemaId,
        event = :Event,
        enabled = :Enabled,
        updated_by = :UpdatedBy,
        updated_at = :UpdatedAt
    where id = :Id
		and queue_id = :QueueId
        and exists(select 1 from cc_queue q where q.id = queue_id and q.domain_id = :DomainId)
    returning *
)
select qe.id,
       cc_get_lookup(qe.schema_id, s.name) "schema",
       qe.event,
       qe.enabled
from qe
    left join flow.acr_routing_scheme s on s.id = qe.schema_id`, map[string]interface{}{
		"Id":        qh.Id,
		"SchemaId":  qh.Schema.Id,
		"Event":     qh.Event,
		"Enabled":   qh.Enabled,
		"UpdatedBy": qh.UpdatedBy.Id,
		"UpdatedAt": qh.UpdatedAt,
		"QueueId":   queueId,
		"DomainId":  domainId,
	})

	if err != nil {
		return nil, model.NewAppError("SqlQueueHookStore.Update", "store.sql_queue_hook.update.app_error", nil, err.Error(), extractCodeFromErr(err))
	}

	return qh, nil
}

func (s SqlQueueHookStore) Delete(domainId int64, queueId, id uint32) *model.AppError {
	if _, err := s.GetMaster().Exec(`delete from cc_queue_events qe where qe.id=:Id and qe.queue_id = :QueueId 
			and exists(select 1 from cc_queue q where q.id = :QueueId and q.domain_id = :DomainId)`,
		map[string]interface{}{"Id": id, "DomainId": domainId, "QueueId": queueId}); err != nil {
		return model.NewAppError("SqlQueueHookStore.Delete", "store.sql_queue_hook.delete.app_error", nil,
			fmt.Sprintf("Id=%v, %s", id, err.Error()), extractCodeFromErr(err))
	}
	return nil
}