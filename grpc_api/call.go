package grpc_api

import (
	"context"
	"github.com/webitel/engine/grpc_api/engine"
	"github.com/webitel/engine/model"
	"net/http"
)

type call struct {
	*API
}

func NewCallApi(app *API) *call {
	return &call{app}
}

func (api *call) SearchHistoryCall(ctx context.Context, in *engine.SearchHistoryCallRequest) (*engine.ListHistoryCall, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	if in.GetCreatedAt() == nil {
		return nil, model.NewAppError("GRPC.SearchHistoryCall", "grpc.call.search_history", nil, "filter created_at is required", http.StatusBadRequest)
	}

	var list []*model.HistoryCall
	var endList bool
	req := &model.SearchHistoryCall{
		CreatedAt: model.FilterBetween{
			From: in.GetCreatedAt().GetFrom(),
			To:   in.GetCreatedAt().GetTo(),
		},
		ListRequest: model.ListRequest{
			DomainId: in.GetDomainId(),
			Page:     int(in.GetPage()),
			PerPage:  int(in.GetSize()),
		},
	}

	if in.GetUserId() != 0 {
		req.UserId = model.NewInt64(in.UserId)
	}

	if list, endList, err = api.ctrl.SearchHistoryCall(session, req); err != nil {
		return nil, err
	}

	items := make([]*engine.HistoryCall, 0, len(list))
	for _, v := range list {
		items = append(items, toEngineHistoryCall(v))
	}

	return &engine.ListHistoryCall{
		Next:  !endList,
		Items: items,
	}, nil
}

func (api *call) ReadCall(ctx context.Context, in *engine.ReadCallRequest) (*engine.Call, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	var call *model.Call
	call, err = api.ctrl.GetCall(session, in.DomainId, in.Id)

	if err != nil {
		return nil, err
	}

	return toEngineCall(call), nil
}

func (api *call) SearchActiveCall(ctx context.Context, in *engine.SearchCallRequest) (*engine.ListCall, error) {
	session, err := api.app.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	var list []*model.Call
	var endList bool
	req := &model.SearchCall{
		ListRequest: model.ListRequest{
			DomainId: in.GetDomainId(),
			Q:        in.GetQ(),
			Page:     int(in.GetPage()),
			PerPage:  int(in.GetSize()),
		},
	}

	list, endList, err = api.ctrl.SearchCall(session, req)

	if err != nil {
		return nil, err
	}

	items := make([]*engine.Call, 0, len(list))
	for _, v := range list {
		items = append(items, toEngineCall(v))
	}
	return &engine.ListCall{
		Next:  !endList,
		Items: items,
	}, nil
}

func (api *call) CreateCall(ctx context.Context, in *engine.CreateCallRequest) (*engine.CreateCallResponse, error) {
	session, err := api.ctrl.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	var req = &model.OutboundCallRequest{
		Destination: in.GetDestination(),
		Params: model.CallParameters{
			Timeout:   int(in.GetParams().GetTimeout()),
			Audio:     in.GetParams().GetAudio(),
			Video:     in.GetParams().GetVideo(),
			Screen:    in.GetParams().GetScreen(),
			Record:    in.GetParams().GetRecord(),
			Variables: in.GetParams().GetVariables(),
		},
	}

	if in.To != nil {
		req.To = &model.EndpointRequest{}
		if in.To.AppId != "" {
			req.To.AppId = model.NewString(in.To.AppId)
		}

		if in.To.Id != 0 {
			req.To.UserId = model.NewInt64(in.To.Id)
		}

	}

	if in.From != nil {
		req.From = &model.EndpointRequest{}
		if in.From.AppId != "" {
			req.From.AppId = model.NewString(in.From.AppId)
		}

		if in.From.Id != 0 {
			req.From.UserId = model.NewInt64(in.From.Id)
		}
	}

	var id string
	id, err = api.ctrl.CreateCall(session, req, nil)
	if err != nil {
		return nil, err
	}

	return &engine.CreateCallResponse{
		Id: id,
	}, nil
}

func (api *call) HangupCall(ctx context.Context, in *engine.HangupCallRequest) (*engine.HangupCallResponse, error) {
	session, err := api.ctrl.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	req := model.HangupCall{
		UserCallRequest: model.UserCallRequest{
			Id: in.GetId(),
		},
	}
	if in.GetAppId() != "" {
		req.AppId = model.NewString(in.GetAppId())
	}
	if in.GetCause() != "" {
		req.Cause = model.NewString(in.GetCause())
	}

	err = api.ctrl.HangupCall(session, session.Domain(in.DomainId), &req)
	if err != nil {
		return nil, err
	}
	return &engine.HangupCallResponse{}, nil
}

func (api *call) HoldCall(ctx context.Context, in *engine.UserCallRequest) (*engine.HoldCallResponse, error) {
	session, err := api.ctrl.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	req := model.UserCallRequest{
		Id: in.GetId(),
	}
	if in.GetAppId() != "" {
		req.AppId = model.NewString(in.GetAppId())
	}

	err = api.ctrl.HoldCall(session, session.Domain(in.DomainId), &req)
	if err != nil {
		return nil, err
	}
	return &engine.HoldCallResponse{
		State: "hold",
	}, nil
}

func (api *call) UnHoldCall(ctx context.Context, in *engine.UserCallRequest) (*engine.HoldCallResponse, error) {
	session, err := api.ctrl.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	req := model.UserCallRequest{
		Id: in.GetId(),
	}
	if in.GetAppId() != "" {
		req.AppId = model.NewString(in.GetAppId())
	}

	err = api.ctrl.UnHoldCall(session, session.Domain(in.DomainId), &req)
	if err != nil {
		return nil, err
	}
	return &engine.HoldCallResponse{
		State: "active",
	}, nil
}

func (api *call) DtmfCall(ctx context.Context, in *engine.DtmfCallRequest) (*engine.DtmfCallResponse, error) {
	session, err := api.ctrl.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	req := model.DtmfCall{
		UserCallRequest: model.UserCallRequest{
			Id: in.GetId(),
		},
	}
	if in.GetAppId() != "" {
		req.AppId = model.NewString(in.GetAppId())
	}

	if len(in.Digit) > 1 {
		req.Digit = rune(in.Digit[0])
	}

	err = api.ctrl.DtmfCall(session, session.Domain(in.DomainId), &req)
	if err != nil {
		return nil, err
	}
	return &engine.DtmfCallResponse{}, nil
}

func (api *call) BlindTransferCall(ctx context.Context, in *engine.BlindTransferCallRequest) (*engine.BlindTransferCallResponse, error) {
	session, err := api.ctrl.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	req := model.BlindTransferCall{
		UserCallRequest: model.UserCallRequest{
			Id: in.GetId(),
		},
		Destination: in.GetDestination(),
	}
	if in.GetAppId() != "" {
		req.AppId = model.NewString(in.GetAppId())
	}

	err = api.ctrl.BlindTransferCall(session, session.Domain(in.DomainId), &req)
	if err != nil {
		return nil, err
	}
	return &engine.BlindTransferCallResponse{}, nil
}

func (api *call) EavesdropCall(ctx context.Context, in *engine.EavesdropCallRequest) (*engine.CreateCallResponse, error) {
	session, err := api.ctrl.GetSessionFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	req := model.EavesdropCall{
		UserCallRequest: model.UserCallRequest{
			Id: in.GetId(),
		},
		Dtmf:        in.Control,
		ALeg:        in.ListenA,
		BLeg:        in.ListenB,
		WhisperALeg: in.WhisperA,
		WhisperBLeg: in.WhisperB,
	}
	if in.GetAppId() != "" {
		req.AppId = model.NewString(in.GetAppId())
	}

	_, err = api.ctrl.EavesdropCall(session, session.Domain(in.DomainId), &req, nil)
	if err != nil {
		return nil, err
	}
	return &engine.CreateCallResponse{}, nil
}

func toEngineCall(src *model.Call) *engine.Call {
	item := &engine.Call{
		Id:        src.Id,
		Timestamp: src.Timestamp,
		State:     src.State,
		Direction: src.Direction,
		From: &engine.Endpoint{
			Type:   src.From.Type,
			Id:     src.From.Id,
			Name:   src.From.Name,
			Number: src.From.Number,
		},
		To: &engine.Endpoint{
			Type:   src.To.Type,
			Id:     src.To.Id,
			Name:   src.To.Name,
			Number: src.To.Number,
		},
	}

	if src.AppId != nil {
		item.AppId = *src.AppId
	}

	if src.ParentId != nil {
		item.ParentId = *src.ParentId
	}

	return item
}

func toEngineHistoryCall(src *model.HistoryCall) *engine.HistoryCall {
	item := &engine.HistoryCall{
		Id:          src.Id,
		AppId:       src.AppId,
		Direction:   src.Direction,
		Destination: src.Destination,
		CreatedAt:   src.CreatedAt,
		AnsweredAt:  src.AnsweredAt,
		BridgedAt:   src.BridgedAt,
		HangupAt:    src.HangupAt,
		HoldSec:     int32(src.HoldSec),
		Cause:       src.Cause,
	}
	if src.ParentId != nil {
		item.ParentId = *src.ParentId
	}

	if src.From != nil {
		item.From = &engine.Endpoint{
			Type:   src.From.Type,
			Number: src.From.Number,
			Id:     src.From.Id,
			Name:   src.From.Name,
		}
	}

	if src.To != nil {
		item.To = &engine.Endpoint{
			Type:   src.To.Type,
			Number: src.To.Number,
			Id:     src.To.Id,
			Name:   src.To.Name,
		}
	}

	if src.SipCode != nil {
		item.SipCode = int32(*src.SipCode)
	}

	return item
}