package grpc_api

import (
	"context"
	"github.com/webitel/engine/app"
	"github.com/webitel/engine/grpc_api/engine"
	"github.com/webitel/engine/model"
)

type supervisorInTeam struct {
	app *app.App
}

func NewSupervisorInTeamApi(app *app.App) *supervisorInTeam {
	return &supervisorInTeam{app: app}
}

func (api *supervisorInTeam) CreateSupervisorInTeam(ctx context.Context, in *engine.CreateSupervisorInTeamRequest) (*engine.SupervisorInTeam, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_TEAM)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	if !permission.CanUpdate() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_UPDATE)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.AgentTeamCheckAccess(session.Domain(in.GetDomainId()), in.GetTeamId(), session.RoleIds, model.PERMISSION_ACCESS_UPDATE); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetTeamId(), permission, model.PERMISSION_ACCESS_UPDATE)
		}
	}

	supervisor := &model.SupervisorInTeam{
		TeamId: in.TeamId,
		Agent: model.Lookup{
			Id: int(in.GetAgent().GetId()),
		},
	}

	if err = supervisor.IsValid(); err != nil {
		return nil, err
	}

	supervisor, err = api.app.CreateSupervisorInTeam(supervisor)
	if err != nil {
		return nil, err
	}

	return transformSupervisorTeam(supervisor), nil
}

func (api *supervisorInTeam) SearchSupervisorInTeam(ctx context.Context, in *engine.SearchSupervisorInTeamRequest) (*engine.ListSupervisorInTeam, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_TEAM)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.AgentTeamCheckAccess(session.Domain(in.GetDomainId()), in.GetTeamId(), session.RoleIds, model.PERMISSION_ACCESS_READ); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetTeamId(), permission, model.PERMISSION_ACCESS_READ)
		}
	}

	var list []*model.SupervisorInTeam
	list, err = api.app.GetSupervisorsPage(session.Domain(int64(in.DomainId)), in.GetTeamId(), int(in.Page), int(in.Size))
	if err != nil {
		return nil, err
	}

	items := make([]*engine.SupervisorInTeam, 0, len(list))
	for _, v := range list {
		items = append(items, transformSupervisorTeam(v))
	}
	return &engine.ListSupervisorInTeam{
		Items: items,
	}, nil
}

func (api *supervisorInTeam) ReadSupervisorInTeam(ctx context.Context, in *engine.ReadSupervisorInTeamRequest) (*engine.SupervisorInTeam, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_TEAM)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.AgentTeamCheckAccess(session.Domain(in.GetDomainId()), in.GetTeamId(), session.RoleIds, model.PERMISSION_ACCESS_READ); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetTeamId(), permission, model.PERMISSION_ACCESS_READ)
		}
	}

	var supervisor *model.SupervisorInTeam
	if supervisor, err = api.app.GetSupervisorsInTeam(session.Domain(in.DomainId), in.GetTeamId(), in.GetId()); err != nil {
		return nil, err
	}
	return transformSupervisorTeam(supervisor), nil
}

func (api *supervisorInTeam) UpdateSupervisorInTeam(ctx context.Context, in *engine.UpdateSupervisorInTeamRequest) (*engine.SupervisorInTeam, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_TEAM)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	if !permission.CanUpdate() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_UPDATE)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.AgentTeamCheckAccess(session.Domain(in.GetDomainId()), in.GetTeamId(), session.RoleIds, model.PERMISSION_ACCESS_UPDATE); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetTeamId(), permission, model.PERMISSION_ACCESS_UPDATE)
		}
	}

	var supervisor *model.SupervisorInTeam

	supervisor, err = api.app.UpdateSupervisorsInTeam(session.Domain(in.GetDomainId()), &model.SupervisorInTeam{
		Id:     in.Id,
		TeamId: in.TeamId,
		Agent: model.Lookup{
			Id: int(in.GetAgent().GetId()),
		},
	})

	if err != nil {
		return nil, err
	}

	return transformSupervisorTeam(supervisor), nil
}

func (api *supervisorInTeam) DeleteSupervisorInTeam(ctx context.Context, in *engine.DeleteSupervisorInTeamReqeust) (*engine.SupervisorInTeam, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_TEAM)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	if !permission.CanUpdate() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_UPDATE)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.AgentTeamCheckAccess(session.Domain(in.GetDomainId()), in.GetTeamId(), session.RoleIds, model.PERMISSION_ACCESS_UPDATE); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetTeamId(), permission, model.PERMISSION_ACCESS_UPDATE)
		}
	}

	var supervisor *model.SupervisorInTeam

	supervisor, err = api.app.RemoveSupervisorsInTeam(session.Domain(in.GetDomainId()), in.GetTeamId(), in.GetId())

	if err != nil {
		return nil, err
	}

	return transformSupervisorTeam(supervisor), nil
}

func transformSupervisorTeam(src *model.SupervisorInTeam) *engine.SupervisorInTeam {
	return &engine.SupervisorInTeam{
		Id:     src.Id,
		TeamId: src.TeamId,
		Agent:  GetProtoLookup(&src.Agent),
	}
}
