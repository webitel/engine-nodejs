package sqlstore

import (
	"fmt"
	"github.com/webitel/engine/model"
	"github.com/webitel/engine/store"
	"net/http"
)

type SqlEmailProfileStore struct {
	SqlStore
}

func NewSqlEmailProfileStore(sqlStore SqlStore) store.EmailProfileStore {
	us := &SqlEmailProfileStore{sqlStore}
	return us
}

func (s SqlEmailProfileStore) Create(p *model.EmailProfile) (*model.EmailProfile, *model.AppError) {
	var profile *model.EmailProfile
	err := s.GetMaster().SelectOne(&profile, `with t as (
    insert into cc_email_profile ( domain_id, name, description, enabled, updated_at, flow_id, host, mailbox, imap_port, smtp_port,
                              login, password, created_at, created_by, updated_by)
values (:DomainId, :Name, :Description, :Enabled, now(), :FlowId, :Host, :Mailbox, :Imap, :Smtp, :Login, :Pass,
        now(), :CreatedBy, :UpdatedBy)
	returning *
)
select t.id, t.domain_id, cc_view_timestamp(t.created_at) created_at, cc_get_lookup(t.created_by, cc.name) created_by,
       cc_view_timestamp(t.updated_at) updated_at, cc_get_lookup(t.updated_by, cu.name) updated_by,
       t.name, t.host, t.login, t.mailbox, t.smtp_port, t.imap_port, cc_get_lookup(t.flow_id, s.name) as schema,
       t.description, t.enabled
from t
    left join directory.wbt_user cc on cc.id = t.created_by
    left join directory.wbt_user cu on cu.id = t.updated_by
    left join flow.acr_routing_scheme s on s.id = t.flow_id`, map[string]interface{}{
		"DomainId":    p.DomainId,
		"Name":        p.Name,
		"Description": p.Description,
		"Enabled":     p.Enabled,
		"FlowId":      p.Schema.Id,
		"Host":        p.Host,
		"Mailbox":     p.Mailbox,
		"Imap":        p.ImapPort,
		"Smtp":        p.SmtpPort,
		"Login":       p.Login,
		"Pass":        p.Password,
		"CreatedBy":   p.CreatedBy.Id,
		"UpdatedBy":   p.UpdatedBy.Id,
	})

	if err != nil {
		return nil, model.NewAppError("SqlEmailProfileStore.Create", "store.sql_email_profile.create.app_error", nil, err.Error(), http.StatusInternalServerError)
	}

	return profile, nil
}

func (s SqlEmailProfileStore) GetAllPage(domainId int64, search *model.SearchEmailProfile) ([]*model.EmailProfile, *model.AppError) {
	var profiles []*model.EmailProfile

	f := map[string]interface{}{
		"DomainId": domainId,
		"Q":        search.GetQ(),
	}

	err := s.ListQuery(&profiles, search.ListRequest,
		`domain_id = :DomainId and (  (:Q::varchar isnull or (description ilike :Q::varchar or name ilike :Q::varchar ) ))`,
		model.EmailProfile{}, f)
	if err != nil {
		return nil, model.NewAppError("SqlEmailProfileStore.GetAllPage", "store.sql_email_profile.get_all.app_error", nil, err.Error(), http.StatusInternalServerError)
	}

	return profiles, nil
}

func (s SqlEmailProfileStore) Get(domainId int64, id int) (*model.EmailProfile, *model.AppError) {
	var profile *model.EmailProfile
	err := s.GetReplica().SelectOne(&profile, `
	select *
	from cc_email_profile_list
	where id = :Id and domain_id = :DomainId`, map[string]interface{}{
		"Id":       id,
		"DomainId": domainId,
	})

	if err != nil {
		return nil, model.NewAppError("SqlEmailProfileStore.Get", "store.sql_email_profile.get.app_error", nil,
			fmt.Sprintf("Id = %d, error: %s", id, err.Error()), extractCodeFromErr(err))
	}

	return profile, nil
}

func (s SqlEmailProfileStore) Update(p *model.EmailProfile) (*model.EmailProfile, *model.AppError) {
	var profile *model.EmailProfile
	err := s.GetMaster().SelectOne(&profile, `with t as (
    update cc_email_profile
        set name = :Name,
			description= :Description,
			flow_id = :FlowId,
            host = :Host,
            login = :Login,
            password = :Pass,
            mailbox = :Mailbox,
            smtp_port = :Smtp,
            imap_port = :Imap,
            updated_by = :UpdatedBy,
            updated_at = now()
        where id = :Id
        returning *
)
select t.id,
       t.domain_id,
       cc_view_timestamp(t.created_at)      created_at,
       cc_get_lookup(t.created_by, cc.name) created_by,
       cc_view_timestamp(t.updated_at)      updated_at,
       cc_get_lookup(t.updated_by, cu.name) updated_by,
       t.name,
       t.host,
       t.login,
       t.mailbox,
       t.smtp_port,
       t.imap_port,
       cc_get_lookup(t.flow_id, s.name) as  schema,
       t.description,
       t.enabled
from t
         left join directory.wbt_user cc on cc.id = t.created_by
         left join directory.wbt_user cu on cu.id = t.updated_by
         left join flow.acr_routing_scheme s on s.id = t.flow_id`, map[string]interface{}{
		"Name":        p.Name,
		"Description": p.Description,
		"FlowId":      p.Schema.Id,
		"Host":        p.Host,
		"Login":       p.Login,
		"Pass":        p.Password,
		"Mailbox":     p.Mailbox,
		"Smtp":        p.SmtpPort,
		"Imap":        p.ImapPort,
		"UpdatedBy":   p.UpdatedBy.Id,
		"Id":          p.Id,
	})

	if err != nil {
		return nil, model.NewAppError("SqlEmailProfileStore.Update", "store.sql_email_profile.update.app_error", nil, err.Error(),
			extractCodeFromErr(err))
	}

	return profile, nil
}

func (s SqlEmailProfileStore) Delete(domainId int64, id int) *model.AppError {
	if _, err := s.GetMaster().Exec(`delete from cc_email_profile c where c.id=:Id and c.domain_id = :DomainId`,
		map[string]interface{}{"Id": id, "DomainId": domainId}); err != nil {
		return model.NewAppError("SqlEmailProfileStore.Delete", "store.sql_email_profile.delete.app_error", nil,
			fmt.Sprintf("Id=%v, %s", id, err.Error()), extractCodeFromErr(err))
	}
	return nil
}