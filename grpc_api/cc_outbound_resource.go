package grpc_api

import (
	"context"
	"github.com/webitel/engine/app"
	"github.com/webitel/engine/grpc_api/engine"
	"github.com/webitel/engine/model"
)

type outboundResource struct {
	app *app.App
}

func NewOutboundResourceApi(app *app.App) *outboundResource {
	return &outboundResource{app: app}
}

func (api *outboundResource) CreateOutboundResource(ctx context.Context, in *engine.CreateOutboundResourceRequest) (*engine.OutboundResource, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_OUTBOUND_RESOURCE)
	if !permission.CanCreate() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_CREATE)
	}

	resource := &model.OutboundCallResource{
		DomainRecord: model.DomainRecord{
			DomainId:  session.Domain(in.GetDomainId()),
			CreatedAt: model.GetMillis(),
			CreatedBy: model.Lookup{
				Id: int(session.UserId),
			},
			UpdatedAt: model.GetMillis(),
			UpdatedBy: model.Lookup{
				Id: int(session.UserId),
			},
		},
		Limit:                 int(in.Limit),
		Enabled:               in.Enabled,
		RPS:                   int(in.Rps),
		Reserve:               in.Reserve,
		Variables:             in.Variables,
		Number:                in.Number,
		MaxSuccessivelyErrors: int(in.MaxSuccessivelyErrors),
		Name:                  in.Name,
		DialString:            in.DialString,
		ErrorIds:              in.ErrorIds,
	}

	if in.Gateway != nil {
		resource.Gateway = &model.Lookup{
			Id: int(in.GetGateway().GetId()),
		}
	}

	if err = resource.IsValid(); err != nil {
		return nil, err
	}

	if resource, err = api.app.CreateOutboundResource(resource); err != nil {
		return nil, err
	} else {
		return transformOutboundResource(resource), nil
	}
}

func (api *outboundResource) SearchOutboundResource(ctx context.Context, in *engine.SearchOutboundResourceRequest) (*engine.ListOutboundResource, error) {

	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_OUTBOUND_RESOURCE)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	var list []*model.OutboundCallResource

	if permission.Rbac {
		list, err = api.app.GetOutboundResourcePageByGroups(session.Domain(in.DomainId), session.RoleIds, int(in.Page), int(in.Size))
	} else {
		list, err = api.app.GetOutboundResourcePage(session.Domain(in.DomainId), int(in.Page), int(in.Size))
	}

	if err != nil {
		return nil, err
	}

	items := make([]*engine.OutboundResource, 0, len(list))
	for _, v := range list {
		items = append(items, transformOutboundResource(v))
	}
	return &engine.ListOutboundResource{
		Items: items,
	}, nil
}

func (api *outboundResource) ReadOutboundResource(ctx context.Context, in *engine.ReadOutboundResourceRequest) (*engine.OutboundResource, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_OUTBOUND_RESOURCE)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	var resource *model.OutboundCallResource

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.OutboundResourceCheckAccess(session.Domain(in.GetDomainId()), in.GetId(), session.RoleIds, model.PERMISSION_ACCESS_READ); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetId(), permission, model.PERMISSION_ACCESS_READ)
		}
	}

	resource, err = api.app.GetOutboundResource(session.Domain(in.DomainId), in.Id)

	if err != nil {
		return nil, err
	}

	return transformOutboundResource(resource), nil
}

func (api *outboundResource) UpdateOutboundResource(ctx context.Context, in *engine.UpdateOutboundResourceRequest) (*engine.OutboundResource, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_OUTBOUND_RESOURCE)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	if !permission.CanUpdate() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_UPDATE)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.OutboundResourceCheckAccess(session.Domain(in.GetDomainId()), in.GetId(), session.RoleIds, model.PERMISSION_ACCESS_UPDATE); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetId(), permission, model.PERMISSION_ACCESS_UPDATE)
		}
	}

	resource := &model.OutboundCallResource{
		DomainRecord: model.DomainRecord{
			Id:        in.Id,
			DomainId:  session.Domain(in.GetDomainId()),
			UpdatedAt: model.GetMillis(),
			UpdatedBy: model.Lookup{
				Id: int(session.UserId),
			},
		},
		Limit:                 int(in.Limit),
		Enabled:               in.Enabled,
		RPS:                   int(in.Rps),
		Reserve:               in.Reserve,
		Variables:             in.Variables,
		Number:                in.Number,
		MaxSuccessivelyErrors: int(in.MaxSuccessivelyErrors),
		Name:                  in.Name,
		DialString:            in.DialString,
		ErrorIds:              in.ErrorIds,
	}

	if in.Gateway != nil {
		resource.Gateway = &model.Lookup{
			Id: int(in.GetGateway().GetId()),
		}
	}

	resource, err = api.app.UpdateOutboundResource(resource)

	if err != nil {
		return nil, err
	}

	return transformOutboundResource(resource), nil
}

func (api *outboundResource) PatchOutboundResource(ctx context.Context, in *engine.PatchOutboundResourceRequest) (*engine.OutboundResource, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_OUTBOUND_RESOURCE)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	if !permission.CanUpdate() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_UPDATE)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.OutboundResourceCheckAccess(session.Domain(in.GetDomainId()), in.GetId(), session.RoleIds, model.PERMISSION_ACCESS_UPDATE); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetId(), permission, model.PERMISSION_ACCESS_UPDATE)
		}
	}

	patch := &model.OutboundCallResourcePath{}
	var resource *model.OutboundCallResource

	//TODO
	for _, v := range in.Fields {
		switch v {
		case "limit":
			patch.Limit = model.NewInt(int(in.Limit))
		case "rps":
			patch.RPS = model.NewInt(int(in.Rps))
		case "max_successively_errors":
			patch.MaxSuccessivelyErrors = model.NewInt(int(in.MaxSuccessivelyErrors))
		case "enabled":
			patch.Enabled = model.NewBool(in.Enabled)
		case "reserve":
			patch.Reserve = model.NewBool(in.Reserve)
		case "name":
			patch.Name = model.NewString(in.Name)
		}
	}

	resource, err = api.app.PatchOutboundResource(session.Domain(in.GetDomainId()), in.GetId(), patch)

	if err != nil {
		return nil, err
	}

	return transformOutboundResource(resource), nil
}

func (api *outboundResource) DeleteOutboundResource(ctx context.Context, in *engine.DeleteOutboundResourceRequest) (*engine.OutboundResource, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_OUTBOUND_RESOURCE)
	if !permission.CanDelete() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_DELETE)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.OutboundResourceCheckAccess(session.Domain(in.GetDomainId()), in.GetId(), session.RoleIds, model.PERMISSION_ACCESS_DELETE); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetId(), permission, model.PERMISSION_ACCESS_DELETE)
		}
	}

	var resource *model.OutboundCallResource
	resource, err = api.app.RemoveOutboundResource(session.Domain(in.DomainId), in.Id)
	if err != nil {
		return nil, err
	}

	return transformOutboundResource(resource), nil
}

func (api *outboundResource) CreateOutboundResourceDisplay(ctx context.Context, in *engine.CreateOutboundResourceDisplayRequest) (*engine.ResourceDisplay, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_OUTBOUND_RESOURCE)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	if !permission.CanUpdate() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_UPDATE)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.OutboundResourceCheckAccess(session.Domain(in.GetDomainId()), in.GetResourceId(), session.RoleIds, model.PERMISSION_ACCESS_UPDATE); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetResourceId(), permission, model.PERMISSION_ACCESS_UPDATE)
		}
	}

	display := &model.ResourceDisplay{
		Display:    in.GetDisplay(),
		ResourceId: in.GetResourceId(),
	}

	if err = display.IsValid(); err != nil {
		return nil, err
	}

	display, err = api.app.CreateOutboundResourceDisplay(display)

	if err != nil {
		return nil, err
	}

	return toEngineResourceDisplay(display), nil
}

func (api *outboundResource) SearchOutboundResourceDisplay(ctx context.Context, in *engine.SearchOutboundResourceDisplayRequest) (*engine.ListOutboundResourceDisplay, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_OUTBOUND_RESOURCE)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.OutboundResourceCheckAccess(session.Domain(in.GetDomainId()), in.GetResourceId(), session.RoleIds, model.PERMISSION_ACCESS_READ); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetResourceId(), permission, model.PERMISSION_ACCESS_READ)
		}
	}

	var list []*model.ResourceDisplay

	list, err = api.app.GetOutboundResourceDisplayPage(session.Domain(in.DomainId), in.GetResourceId(), int(in.GetPage()), int(in.GetSize()))

	items := make([]*engine.ResourceDisplay, 0, len(list))
	for _, v := range list {
		items = append(items, toEngineResourceDisplay(v))
	}
	return &engine.ListOutboundResourceDisplay{
		Items: items,
	}, nil
}

func (api *outboundResource) ReadOutboundResourceDisplay(ctx context.Context, in *engine.ReadOutboundResourceDisplayRequest) (*engine.ResourceDisplay, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_OUTBOUND_RESOURCE)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.OutboundResourceCheckAccess(session.Domain(in.GetDomainId()), in.GetResourceId(), session.RoleIds, model.PERMISSION_ACCESS_READ); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetResourceId(), permission, model.PERMISSION_ACCESS_READ)
		}
	}

	var display *model.ResourceDisplay
	display, err = api.app.GetOutboundResourceDisplay(session.Domain(in.GetDomainId()), in.GetResourceId(), in.GetId())

	if err != nil {
		return nil, err
	} else {
		return toEngineResourceDisplay(display), nil
	}
}

func (api *outboundResource) UpdateOutboundResourceDisplay(ctx context.Context, in *engine.UpdateOutboundResourceDisplayRequest) (*engine.ResourceDisplay, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_OUTBOUND_RESOURCE)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	if !permission.CanUpdate() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_UPDATE)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.OutboundResourceCheckAccess(session.Domain(in.GetDomainId()), in.GetResourceId(), session.RoleIds, model.PERMISSION_ACCESS_UPDATE); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetResourceId(), permission, model.PERMISSION_ACCESS_UPDATE)
		}
	}

	display := &model.ResourceDisplay{
		Id:         in.GetId(),
		Display:    in.GetDisplay(),
		ResourceId: in.GetResourceId(),
	}

	if err = display.IsValid(); err != nil {
		return nil, err
	}

	display, err = api.app.UpdateOutboundResourceDisplay(session.Domain(in.GetDomainId()), display)

	if err != nil {
		return nil, err
	}

	return toEngineResourceDisplay(display), nil
}

func (api *outboundResource) DeleteOutboundResourceDisplay(ctx context.Context, in *engine.DeleteOutboundResourceDisplayRequest) (*engine.ResourceDisplay, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	permission := session.GetPermission(model.PERMISSION_SCOPE_CC_OUTBOUND_RESOURCE)
	if !permission.CanRead() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_READ)
	}

	if !permission.CanUpdate() {
		return nil, api.app.MakePermissionError(session, permission, model.PERMISSION_ACCESS_UPDATE)
	}

	if permission.Rbac {
		var perm bool
		if perm, err = api.app.OutboundResourceCheckAccess(session.Domain(in.GetDomainId()), in.GetResourceId(), session.RoleIds, model.PERMISSION_ACCESS_UPDATE); err != nil {
			return nil, err
		} else if !perm {
			return nil, api.app.MakeResourcePermissionError(session, in.GetResourceId(), permission, model.PERMISSION_ACCESS_UPDATE)
		}
	}

	var display *model.ResourceDisplay
	display, err = api.app.RemoveOutboundResourceDisplay(session.Domain(in.GetDomainId()), in.GetResourceId(), in.GetId())

	if err != nil {
		return nil, err
	} else {
		return toEngineResourceDisplay(display), nil
	}

}

func toEngineResourceDisplay(src *model.ResourceDisplay) *engine.ResourceDisplay {
	return &engine.ResourceDisplay{
		Id:      src.Id,
		Display: src.Display,
	}
}

func transformOutboundResource(src *model.OutboundCallResource) *engine.OutboundResource {
	res := &engine.OutboundResource{
		Id:        src.Id,
		DomainId:  src.DomainId,
		CreatedAt: src.CreatedAt,
		CreatedBy: &engine.Lookup{
			Id:   int64(src.CreatedBy.Id),
			Name: src.CreatedBy.Name,
		},
		UpdatedAt: src.UpdatedAt,
		UpdatedBy: &engine.Lookup{
			Id:   int64(src.UpdatedBy.Id),
			Name: src.UpdatedBy.Name,
		},
		Limit:                 int32(src.Limit),
		Enabled:               src.Enabled,
		Rps:                   int32(src.RPS),
		Reserve:               src.Reserve,
		Number:                src.Number,
		MaxSuccessivelyErrors: int32(src.MaxSuccessivelyErrors),
		Name:                  src.Name,
		DialString:            src.DialString,
		Variables:             src.Variables,
		ErrorIds:              src.ErrorIds,
		LastErrorId:           src.LastError(),
		SuccessivelyErrors:    int32(src.SuccessivelyErrors),
		LastErrorAt:           src.LastErrorAt,
	}

	if src.Gateway != nil {
		res.Gateway = &engine.Lookup{
			Id:   int64(src.Gateway.Id),
			Name: src.Gateway.Name,
		}
	}

	return res
}