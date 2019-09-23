package sqlstore

import (
	"fmt"
	"github.com/webitel/engine/model"
	"github.com/webitel/engine/store"
	"net/http"
)

type SqlAgentSkillStore struct {
	SqlStore
}

func NewSqlAgentSkillStore(sqlStore SqlStore) store.AgentSkillStore {
	us := &SqlAgentSkillStore{sqlStore}
	return us
}

func (s SqlAgentSkillStore) Create(in *model.AgentSkill) (*model.AgentSkill, *model.AppError) {
	var out *model.AgentSkill
	if err := s.GetMaster().SelectOne(&out, `with tmp as (
    insert into cc_skill_in_agent (skill_id, agent_id, capacity, created_at, created_by, updated_at, updated_by)
    values (:SkillId, :AgentId, :Capacity, :CreatedAt, :CreatedBy, :UpdatedAt, :UpdatedBy)
    returning *
)
select tmp.id, cc_get_lookup(s.id, s.name) as skill, cc_get_lookup(a.id, wu.name) as agent, tmp.capacity, tmp.created_at,
	cc_get_lookup(c.id, c.name) as created_by, tmp.updated_at, cc_get_lookup(u.id, u.name) as updated_by
from tmp
    inner join cc_skill s on s.id = tmp.skill_id
    inner join cc_agent a on a.id = tmp.agent_id
    inner join wbt_user wu on a.user_id = wu.id
    left join wbt_user c on c.id = tmp.created_by
    left join wbt_user u on u.id = tmp.updated_by`,
		map[string]interface{}{
			"SkillId":   in.Skill.Id,
			"AgentId":   in.Agent.Id,
			"Capacity":  in.Capacity,
			"CreatedAt": in.CreatedAt,
			"CreatedBy": in.CreatedBy.Id,
			"UpdatedAt": in.UpdatedAt,
			"UpdatedBy": in.UpdatedBy.Id,
		}); err != nil {
		return nil, model.NewAppError("SqlAgentSkillStore.Create", "store.sql_skill_in_agent.create.app_error", nil,
			fmt.Sprintf("AgentId=%v, SkillId=%v %s", in.Agent.Id, in.Skill.Id, err.Error()), extractCodeFromErr(err))
	} else {
		return out, nil
	}
}

func (s SqlAgentSkillStore) GetAllPage(domainId, agentId int64, offset, limit int) ([]*model.AgentSkill, *model.AppError) {
	var agentSkill []*model.AgentSkill

	if _, err := s.GetReplica().Select(&agentSkill,
		`select sa.id, cc_get_lookup(cs.id, cs.name) as skill, cc_get_lookup(ca.id, u.name) as agent, sa.capacity
from cc_skill_in_agent sa
    inner join cc_agent ca on sa.agent_id = ca.id
    inner join wbt_user u on u.id = ca.user_id
    inner join cc_skill cs on sa.skill_id = cs.id
where sa.agent_id = :AgentId and ca.domain_id = :DomainId
order by sa.capacity desc
limit :Limit
offset :Offset`, map[string]interface{}{"DomainId": domainId, "Limit": limit, "Offset": offset, "AgentId": agentId}); err != nil {
		return nil, model.NewAppError("SqlAgentSkillStore.GetAllPage", "store.sql_skill_in_agent.get_all.app_error", nil, err.Error(), http.StatusInternalServerError)
	} else {
		return agentSkill, nil
	}
}

func (s SqlAgentSkillStore) GetById(domainId, agentId, id int64) (*model.AgentSkill, *model.AppError) {
	var agentSkill *model.AgentSkill

	if err := s.GetReplica().SelectOne(&agentSkill,
		`select tmp.id, cc_get_lookup(s.id, s.name) as skill, cc_get_lookup(a.id, wu.name) as agent, tmp.capacity, tmp.created_at,
	cc_get_lookup(c.id, c.name) as created_by, tmp.updated_at, cc_get_lookup(u.id, u.name) as updated_by
from cc_skill_in_agent tmp
    inner join cc_skill s on s.id = tmp.skill_id
    inner join cc_agent a on a.id = tmp.agent_id
    inner join wbt_user wu on a.user_id = wu.id
    left join wbt_user c on c.id = tmp.created_by
    left join wbt_user u on u.id = tmp.updated_by
where tmp.id = :Id and tmp.agent_id = :AgentId and a.domain_id = :DomainId
`, map[string]interface{}{"DomainId": domainId, "Id": id, "AgentId": agentId}); err != nil {
		return nil, model.NewAppError("SqlAgentSkillStore.GetAllPage", "store.sql_skill_in_agent.get_all.app_error", nil, err.Error(), extractCodeFromErr(err))
	} else {
		return agentSkill, nil
	}
}

func (s SqlAgentSkillStore) Update(agentSkill *model.AgentSkill) (*model.AgentSkill, *model.AppError) {
	var out *model.AgentSkill
	err := s.GetMaster().SelectOne(&out, `with tmp as (
    update cc_skill_in_agent s
        set updated_at = :UpdatedAt,
            updated_by = :UpdatedBy,
            skill_id = :SkillId,
            capacity = :Capacity
    where s.id = :Id and s.agent_id = :AgentId
    returning *
)
select tmp.id, cc_get_lookup(s.id, s.name) as skill, cc_get_lookup(a.id, wu.name) as agent, tmp.capacity, tmp.created_at,
	cc_get_lookup(c.id, c.name) as created_by, tmp.updated_at, cc_get_lookup(u.id, u.name) as updated_by
from tmp
    inner join cc_skill s on s.id = tmp.skill_id
    inner join cc_agent a on a.id = tmp.agent_id
    inner join wbt_user wu on a.user_id = wu.id
    left join wbt_user c on c.id = tmp.created_by
    left join wbt_user u on u.id = tmp.updated_by`, map[string]interface{}{
		"UpdatedAt": agentSkill.UpdatedAt,
		"UpdatedBy": agentSkill.UpdatedBy.Id,
		"SkillId":   agentSkill.Skill.Id,
		"Capacity":  agentSkill.Capacity,
		"Id":        agentSkill.Id,
		"AgentId":   agentSkill.Agent.Id,
	})
	if err != nil {
		return nil, model.NewAppError("SqlAgentSkillStore.Update", "store.sql_skill_in_agent.update.app_error", nil,
			fmt.Sprintf("Id=%v, %s", agentSkill.Id, err.Error()), extractCodeFromErr(err))
	}
	return out, nil
}

func (s SqlAgentSkillStore) Delete(agentId, id int64) *model.AppError {
	if _, err := s.GetMaster().Exec(`delete from cc_skill_in_agent a
where a.id = :Id and a.agent_id = :AgentId`,
		map[string]interface{}{"Id": id, "AgentId": agentId}); err != nil {
		return model.NewAppError("SqlAgentSkillStore.Delete", "store.sql_skill_in_agent.delete.app_error", nil,
			fmt.Sprintf("Id=%v, %s", id, err.Error()), extractCodeFromErr(err))
	}
	return nil
}
