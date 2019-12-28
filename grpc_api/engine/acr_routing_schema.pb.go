// Code generated by protoc-gen-go. DO NOT EDIT.
// source: acr_routing_schema.proto

package engine

import (
	context "context"
	fmt "fmt"
	proto "github.com/golang/protobuf/proto"
	_struct "github.com/golang/protobuf/ptypes/struct"
	_ "google.golang.org/genproto/googleapis/api/annotations"
	grpc "google.golang.org/grpc"
	codes "google.golang.org/grpc/codes"
	status "google.golang.org/grpc/status"
	math "math"
)

// Reference imports to suppress errors if they are not otherwise used.
var _ = proto.Marshal
var _ = fmt.Errorf
var _ = math.Inf

// This is a compile-time assertion to ensure that this generated file
// is compatible with the proto package it is being compiled against.
// A compilation error at this line likely means your copy of the
// proto package needs to be updated.
const _ = proto.ProtoPackageIsVersion3 // please upgrade the proto package

type PatchRoutingSchemaRequest struct {
	Id                   int64          `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	DomainId             int64          `protobuf:"varint,2,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	Name                 string         `protobuf:"bytes,3,opt,name=name,proto3" json:"name,omitempty"`
	Description          string         `protobuf:"bytes,4,opt,name=description,proto3" json:"description,omitempty"`
	Type                 int32          `protobuf:"varint,5,opt,name=type,proto3" json:"type,omitempty"`
	Schema               *_struct.Value `protobuf:"bytes,6,opt,name=schema,proto3" json:"schema,omitempty"`
	Payload              *_struct.Value `protobuf:"bytes,7,opt,name=payload,proto3" json:"payload,omitempty"`
	Debug                bool           `protobuf:"varint,8,opt,name=debug,proto3" json:"debug,omitempty"`
	Fields               []string       `protobuf:"bytes,9,rep,name=fields,proto3" json:"fields,omitempty"`
	XXX_NoUnkeyedLiteral struct{}       `json:"-"`
	XXX_unrecognized     []byte         `json:"-"`
	XXX_sizecache        int32          `json:"-"`
}

func (m *PatchRoutingSchemaRequest) Reset()         { *m = PatchRoutingSchemaRequest{} }
func (m *PatchRoutingSchemaRequest) String() string { return proto.CompactTextString(m) }
func (*PatchRoutingSchemaRequest) ProtoMessage()    {}
func (*PatchRoutingSchemaRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_7e8e6387a1066a92, []int{0}
}

func (m *PatchRoutingSchemaRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_PatchRoutingSchemaRequest.Unmarshal(m, b)
}
func (m *PatchRoutingSchemaRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_PatchRoutingSchemaRequest.Marshal(b, m, deterministic)
}
func (m *PatchRoutingSchemaRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_PatchRoutingSchemaRequest.Merge(m, src)
}
func (m *PatchRoutingSchemaRequest) XXX_Size() int {
	return xxx_messageInfo_PatchRoutingSchemaRequest.Size(m)
}
func (m *PatchRoutingSchemaRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_PatchRoutingSchemaRequest.DiscardUnknown(m)
}

var xxx_messageInfo_PatchRoutingSchemaRequest proto.InternalMessageInfo

func (m *PatchRoutingSchemaRequest) GetId() int64 {
	if m != nil {
		return m.Id
	}
	return 0
}

func (m *PatchRoutingSchemaRequest) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

func (m *PatchRoutingSchemaRequest) GetName() string {
	if m != nil {
		return m.Name
	}
	return ""
}

func (m *PatchRoutingSchemaRequest) GetDescription() string {
	if m != nil {
		return m.Description
	}
	return ""
}

func (m *PatchRoutingSchemaRequest) GetType() int32 {
	if m != nil {
		return m.Type
	}
	return 0
}

func (m *PatchRoutingSchemaRequest) GetSchema() *_struct.Value {
	if m != nil {
		return m.Schema
	}
	return nil
}

func (m *PatchRoutingSchemaRequest) GetPayload() *_struct.Value {
	if m != nil {
		return m.Payload
	}
	return nil
}

func (m *PatchRoutingSchemaRequest) GetDebug() bool {
	if m != nil {
		return m.Debug
	}
	return false
}

func (m *PatchRoutingSchemaRequest) GetFields() []string {
	if m != nil {
		return m.Fields
	}
	return nil
}

type DeleteRoutingSchemaRequest struct {
	DomainId             int64    `protobuf:"varint,1,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	Id                   int64    `protobuf:"varint,2,opt,name=id,proto3" json:"id,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *DeleteRoutingSchemaRequest) Reset()         { *m = DeleteRoutingSchemaRequest{} }
func (m *DeleteRoutingSchemaRequest) String() string { return proto.CompactTextString(m) }
func (*DeleteRoutingSchemaRequest) ProtoMessage()    {}
func (*DeleteRoutingSchemaRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_7e8e6387a1066a92, []int{1}
}

func (m *DeleteRoutingSchemaRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_DeleteRoutingSchemaRequest.Unmarshal(m, b)
}
func (m *DeleteRoutingSchemaRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_DeleteRoutingSchemaRequest.Marshal(b, m, deterministic)
}
func (m *DeleteRoutingSchemaRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_DeleteRoutingSchemaRequest.Merge(m, src)
}
func (m *DeleteRoutingSchemaRequest) XXX_Size() int {
	return xxx_messageInfo_DeleteRoutingSchemaRequest.Size(m)
}
func (m *DeleteRoutingSchemaRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_DeleteRoutingSchemaRequest.DiscardUnknown(m)
}

var xxx_messageInfo_DeleteRoutingSchemaRequest proto.InternalMessageInfo

func (m *DeleteRoutingSchemaRequest) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

func (m *DeleteRoutingSchemaRequest) GetId() int64 {
	if m != nil {
		return m.Id
	}
	return 0
}

type UpdateRoutingSchemaRequest struct {
	Id                   int64          `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	DomainId             int64          `protobuf:"varint,2,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	Name                 string         `protobuf:"bytes,3,opt,name=name,proto3" json:"name,omitempty"`
	Description          string         `protobuf:"bytes,4,opt,name=description,proto3" json:"description,omitempty"`
	Type                 int32          `protobuf:"varint,5,opt,name=type,proto3" json:"type,omitempty"`
	Schema               *_struct.Value `protobuf:"bytes,6,opt,name=schema,proto3" json:"schema,omitempty"`
	Payload              *_struct.Value `protobuf:"bytes,7,opt,name=payload,proto3" json:"payload,omitempty"`
	Debug                bool           `protobuf:"varint,8,opt,name=debug,proto3" json:"debug,omitempty"`
	XXX_NoUnkeyedLiteral struct{}       `json:"-"`
	XXX_unrecognized     []byte         `json:"-"`
	XXX_sizecache        int32          `json:"-"`
}

func (m *UpdateRoutingSchemaRequest) Reset()         { *m = UpdateRoutingSchemaRequest{} }
func (m *UpdateRoutingSchemaRequest) String() string { return proto.CompactTextString(m) }
func (*UpdateRoutingSchemaRequest) ProtoMessage()    {}
func (*UpdateRoutingSchemaRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_7e8e6387a1066a92, []int{2}
}

func (m *UpdateRoutingSchemaRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_UpdateRoutingSchemaRequest.Unmarshal(m, b)
}
func (m *UpdateRoutingSchemaRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_UpdateRoutingSchemaRequest.Marshal(b, m, deterministic)
}
func (m *UpdateRoutingSchemaRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_UpdateRoutingSchemaRequest.Merge(m, src)
}
func (m *UpdateRoutingSchemaRequest) XXX_Size() int {
	return xxx_messageInfo_UpdateRoutingSchemaRequest.Size(m)
}
func (m *UpdateRoutingSchemaRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_UpdateRoutingSchemaRequest.DiscardUnknown(m)
}

var xxx_messageInfo_UpdateRoutingSchemaRequest proto.InternalMessageInfo

func (m *UpdateRoutingSchemaRequest) GetId() int64 {
	if m != nil {
		return m.Id
	}
	return 0
}

func (m *UpdateRoutingSchemaRequest) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

func (m *UpdateRoutingSchemaRequest) GetName() string {
	if m != nil {
		return m.Name
	}
	return ""
}

func (m *UpdateRoutingSchemaRequest) GetDescription() string {
	if m != nil {
		return m.Description
	}
	return ""
}

func (m *UpdateRoutingSchemaRequest) GetType() int32 {
	if m != nil {
		return m.Type
	}
	return 0
}

func (m *UpdateRoutingSchemaRequest) GetSchema() *_struct.Value {
	if m != nil {
		return m.Schema
	}
	return nil
}

func (m *UpdateRoutingSchemaRequest) GetPayload() *_struct.Value {
	if m != nil {
		return m.Payload
	}
	return nil
}

func (m *UpdateRoutingSchemaRequest) GetDebug() bool {
	if m != nil {
		return m.Debug
	}
	return false
}

type ReadRoutingSchemaRequest struct {
	DomainId             int64    `protobuf:"varint,1,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	Id                   int64    `protobuf:"varint,2,opt,name=id,proto3" json:"id,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *ReadRoutingSchemaRequest) Reset()         { *m = ReadRoutingSchemaRequest{} }
func (m *ReadRoutingSchemaRequest) String() string { return proto.CompactTextString(m) }
func (*ReadRoutingSchemaRequest) ProtoMessage()    {}
func (*ReadRoutingSchemaRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_7e8e6387a1066a92, []int{3}
}

func (m *ReadRoutingSchemaRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_ReadRoutingSchemaRequest.Unmarshal(m, b)
}
func (m *ReadRoutingSchemaRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_ReadRoutingSchemaRequest.Marshal(b, m, deterministic)
}
func (m *ReadRoutingSchemaRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_ReadRoutingSchemaRequest.Merge(m, src)
}
func (m *ReadRoutingSchemaRequest) XXX_Size() int {
	return xxx_messageInfo_ReadRoutingSchemaRequest.Size(m)
}
func (m *ReadRoutingSchemaRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_ReadRoutingSchemaRequest.DiscardUnknown(m)
}

var xxx_messageInfo_ReadRoutingSchemaRequest proto.InternalMessageInfo

func (m *ReadRoutingSchemaRequest) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

func (m *ReadRoutingSchemaRequest) GetId() int64 {
	if m != nil {
		return m.Id
	}
	return 0
}

type SearchRoutingSchemaRequest struct {
	DomainId             int64    `protobuf:"varint,1,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	Size                 int32    `protobuf:"varint,2,opt,name=size,proto3" json:"size,omitempty"`
	Page                 int32    `protobuf:"varint,3,opt,name=page,proto3" json:"page,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *SearchRoutingSchemaRequest) Reset()         { *m = SearchRoutingSchemaRequest{} }
func (m *SearchRoutingSchemaRequest) String() string { return proto.CompactTextString(m) }
func (*SearchRoutingSchemaRequest) ProtoMessage()    {}
func (*SearchRoutingSchemaRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_7e8e6387a1066a92, []int{4}
}

func (m *SearchRoutingSchemaRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_SearchRoutingSchemaRequest.Unmarshal(m, b)
}
func (m *SearchRoutingSchemaRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_SearchRoutingSchemaRequest.Marshal(b, m, deterministic)
}
func (m *SearchRoutingSchemaRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_SearchRoutingSchemaRequest.Merge(m, src)
}
func (m *SearchRoutingSchemaRequest) XXX_Size() int {
	return xxx_messageInfo_SearchRoutingSchemaRequest.Size(m)
}
func (m *SearchRoutingSchemaRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_SearchRoutingSchemaRequest.DiscardUnknown(m)
}

var xxx_messageInfo_SearchRoutingSchemaRequest proto.InternalMessageInfo

func (m *SearchRoutingSchemaRequest) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

func (m *SearchRoutingSchemaRequest) GetSize() int32 {
	if m != nil {
		return m.Size
	}
	return 0
}

func (m *SearchRoutingSchemaRequest) GetPage() int32 {
	if m != nil {
		return m.Page
	}
	return 0
}

type CreateRoutingSchemaRequest struct {
	DomainId             int64          `protobuf:"varint,1,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	Name                 string         `protobuf:"bytes,2,opt,name=name,proto3" json:"name,omitempty"`
	Description          string         `protobuf:"bytes,3,opt,name=description,proto3" json:"description,omitempty"`
	Type                 int32          `protobuf:"varint,4,opt,name=type,proto3" json:"type,omitempty"`
	Schema               *_struct.Value `protobuf:"bytes,5,opt,name=schema,proto3" json:"schema,omitempty"`
	Payload              *_struct.Value `protobuf:"bytes,6,opt,name=payload,proto3" json:"payload,omitempty"`
	Debug                bool           `protobuf:"varint,7,opt,name=debug,proto3" json:"debug,omitempty"`
	XXX_NoUnkeyedLiteral struct{}       `json:"-"`
	XXX_unrecognized     []byte         `json:"-"`
	XXX_sizecache        int32          `json:"-"`
}

func (m *CreateRoutingSchemaRequest) Reset()         { *m = CreateRoutingSchemaRequest{} }
func (m *CreateRoutingSchemaRequest) String() string { return proto.CompactTextString(m) }
func (*CreateRoutingSchemaRequest) ProtoMessage()    {}
func (*CreateRoutingSchemaRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_7e8e6387a1066a92, []int{5}
}

func (m *CreateRoutingSchemaRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_CreateRoutingSchemaRequest.Unmarshal(m, b)
}
func (m *CreateRoutingSchemaRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_CreateRoutingSchemaRequest.Marshal(b, m, deterministic)
}
func (m *CreateRoutingSchemaRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_CreateRoutingSchemaRequest.Merge(m, src)
}
func (m *CreateRoutingSchemaRequest) XXX_Size() int {
	return xxx_messageInfo_CreateRoutingSchemaRequest.Size(m)
}
func (m *CreateRoutingSchemaRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_CreateRoutingSchemaRequest.DiscardUnknown(m)
}

var xxx_messageInfo_CreateRoutingSchemaRequest proto.InternalMessageInfo

func (m *CreateRoutingSchemaRequest) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

func (m *CreateRoutingSchemaRequest) GetName() string {
	if m != nil {
		return m.Name
	}
	return ""
}

func (m *CreateRoutingSchemaRequest) GetDescription() string {
	if m != nil {
		return m.Description
	}
	return ""
}

func (m *CreateRoutingSchemaRequest) GetType() int32 {
	if m != nil {
		return m.Type
	}
	return 0
}

func (m *CreateRoutingSchemaRequest) GetSchema() *_struct.Value {
	if m != nil {
		return m.Schema
	}
	return nil
}

func (m *CreateRoutingSchemaRequest) GetPayload() *_struct.Value {
	if m != nil {
		return m.Payload
	}
	return nil
}

func (m *CreateRoutingSchemaRequest) GetDebug() bool {
	if m != nil {
		return m.Debug
	}
	return false
}

type RoutingSchema struct {
	Id                   int64          `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	DomainId             int64          `protobuf:"varint,2,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	CreatedAt            int64          `protobuf:"varint,3,opt,name=created_at,json=createdAt,proto3" json:"created_at,omitempty"`
	CreatedBy            *Lookup        `protobuf:"bytes,4,opt,name=created_by,json=createdBy,proto3" json:"created_by,omitempty"`
	UpdatedAt            int64          `protobuf:"varint,5,opt,name=updated_at,json=updatedAt,proto3" json:"updated_at,omitempty"`
	UpdatedBy            *Lookup        `protobuf:"bytes,6,opt,name=updated_by,json=updatedBy,proto3" json:"updated_by,omitempty"`
	Name                 string         `protobuf:"bytes,7,opt,name=name,proto3" json:"name,omitempty"`
	Description          string         `protobuf:"bytes,8,opt,name=description,proto3" json:"description,omitempty"`
	Type                 int32          `protobuf:"varint,9,opt,name=type,proto3" json:"type,omitempty"`
	Schema               *_struct.Value `protobuf:"bytes,10,opt,name=schema,proto3" json:"schema,omitempty"`
	Payload              *_struct.Value `protobuf:"bytes,11,opt,name=payload,proto3" json:"payload,omitempty"`
	Debug                bool           `protobuf:"varint,12,opt,name=debug,proto3" json:"debug,omitempty"`
	XXX_NoUnkeyedLiteral struct{}       `json:"-"`
	XXX_unrecognized     []byte         `json:"-"`
	XXX_sizecache        int32          `json:"-"`
}

func (m *RoutingSchema) Reset()         { *m = RoutingSchema{} }
func (m *RoutingSchema) String() string { return proto.CompactTextString(m) }
func (*RoutingSchema) ProtoMessage()    {}
func (*RoutingSchema) Descriptor() ([]byte, []int) {
	return fileDescriptor_7e8e6387a1066a92, []int{6}
}

func (m *RoutingSchema) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_RoutingSchema.Unmarshal(m, b)
}
func (m *RoutingSchema) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_RoutingSchema.Marshal(b, m, deterministic)
}
func (m *RoutingSchema) XXX_Merge(src proto.Message) {
	xxx_messageInfo_RoutingSchema.Merge(m, src)
}
func (m *RoutingSchema) XXX_Size() int {
	return xxx_messageInfo_RoutingSchema.Size(m)
}
func (m *RoutingSchema) XXX_DiscardUnknown() {
	xxx_messageInfo_RoutingSchema.DiscardUnknown(m)
}

var xxx_messageInfo_RoutingSchema proto.InternalMessageInfo

func (m *RoutingSchema) GetId() int64 {
	if m != nil {
		return m.Id
	}
	return 0
}

func (m *RoutingSchema) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

func (m *RoutingSchema) GetCreatedAt() int64 {
	if m != nil {
		return m.CreatedAt
	}
	return 0
}

func (m *RoutingSchema) GetCreatedBy() *Lookup {
	if m != nil {
		return m.CreatedBy
	}
	return nil
}

func (m *RoutingSchema) GetUpdatedAt() int64 {
	if m != nil {
		return m.UpdatedAt
	}
	return 0
}

func (m *RoutingSchema) GetUpdatedBy() *Lookup {
	if m != nil {
		return m.UpdatedBy
	}
	return nil
}

func (m *RoutingSchema) GetName() string {
	if m != nil {
		return m.Name
	}
	return ""
}

func (m *RoutingSchema) GetDescription() string {
	if m != nil {
		return m.Description
	}
	return ""
}

func (m *RoutingSchema) GetType() int32 {
	if m != nil {
		return m.Type
	}
	return 0
}

func (m *RoutingSchema) GetSchema() *_struct.Value {
	if m != nil {
		return m.Schema
	}
	return nil
}

func (m *RoutingSchema) GetPayload() *_struct.Value {
	if m != nil {
		return m.Payload
	}
	return nil
}

func (m *RoutingSchema) GetDebug() bool {
	if m != nil {
		return m.Debug
	}
	return false
}

type ListRoutingSchema struct {
	Items                []*RoutingSchema `protobuf:"bytes,1,rep,name=items,proto3" json:"items,omitempty"`
	XXX_NoUnkeyedLiteral struct{}         `json:"-"`
	XXX_unrecognized     []byte           `json:"-"`
	XXX_sizecache        int32            `json:"-"`
}

func (m *ListRoutingSchema) Reset()         { *m = ListRoutingSchema{} }
func (m *ListRoutingSchema) String() string { return proto.CompactTextString(m) }
func (*ListRoutingSchema) ProtoMessage()    {}
func (*ListRoutingSchema) Descriptor() ([]byte, []int) {
	return fileDescriptor_7e8e6387a1066a92, []int{7}
}

func (m *ListRoutingSchema) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_ListRoutingSchema.Unmarshal(m, b)
}
func (m *ListRoutingSchema) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_ListRoutingSchema.Marshal(b, m, deterministic)
}
func (m *ListRoutingSchema) XXX_Merge(src proto.Message) {
	xxx_messageInfo_ListRoutingSchema.Merge(m, src)
}
func (m *ListRoutingSchema) XXX_Size() int {
	return xxx_messageInfo_ListRoutingSchema.Size(m)
}
func (m *ListRoutingSchema) XXX_DiscardUnknown() {
	xxx_messageInfo_ListRoutingSchema.DiscardUnknown(m)
}

var xxx_messageInfo_ListRoutingSchema proto.InternalMessageInfo

func (m *ListRoutingSchema) GetItems() []*RoutingSchema {
	if m != nil {
		return m.Items
	}
	return nil
}

func init() {
	proto.RegisterType((*PatchRoutingSchemaRequest)(nil), "engine.PatchRoutingSchemaRequest")
	proto.RegisterType((*DeleteRoutingSchemaRequest)(nil), "engine.DeleteRoutingSchemaRequest")
	proto.RegisterType((*UpdateRoutingSchemaRequest)(nil), "engine.UpdateRoutingSchemaRequest")
	proto.RegisterType((*ReadRoutingSchemaRequest)(nil), "engine.ReadRoutingSchemaRequest")
	proto.RegisterType((*SearchRoutingSchemaRequest)(nil), "engine.SearchRoutingSchemaRequest")
	proto.RegisterType((*CreateRoutingSchemaRequest)(nil), "engine.CreateRoutingSchemaRequest")
	proto.RegisterType((*RoutingSchema)(nil), "engine.RoutingSchema")
	proto.RegisterType((*ListRoutingSchema)(nil), "engine.ListRoutingSchema")
}

func init() { proto.RegisterFile("acr_routing_schema.proto", fileDescriptor_7e8e6387a1066a92) }

var fileDescriptor_7e8e6387a1066a92 = []byte{
	// 683 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0xe4, 0x55, 0xcd, 0x6e, 0xd3, 0x4a,
	0x14, 0x96, 0xed, 0x38, 0x3f, 0x27, 0xf7, 0xf6, 0xaa, 0x93, 0xdc, 0x5e, 0xd7, 0xb7, 0x08, 0xe3,
	0x95, 0x55, 0x84, 0x83, 0xc2, 0x8e, 0x15, 0x14, 0x24, 0x54, 0xa9, 0x0b, 0xe4, 0x0a, 0xb6, 0xd1,
	0xc4, 0x33, 0x4d, 0x07, 0x12, 0x8f, 0x6b, 0x8f, 0x91, 0x02, 0x62, 0xc3, 0x96, 0x25, 0x3b, 0x96,
	0xbc, 0x02, 0x8f, 0xc2, 0x2b, 0xf0, 0x16, 0x6c, 0x50, 0x66, 0xec, 0xa4, 0x49, 0x3d, 0xad, 0x02,
	0x4b, 0x76, 0x33, 0xe7, 0x8c, 0xcf, 0xe7, 0xef, 0xfb, 0xe6, 0xcc, 0x01, 0x07, 0xc7, 0xd9, 0x28,
	0xe3, 0x85, 0x60, 0xc9, 0x64, 0x94, 0xc7, 0xe7, 0x74, 0x86, 0xc3, 0x34, 0xe3, 0x82, 0xa3, 0x26,
	0x4d, 0x26, 0x2c, 0xa1, 0x6e, 0x37, 0xe6, 0x49, 0x2e, 0x54, 0xd0, 0x3d, 0x98, 0x70, 0x3e, 0x99,
	0xd2, 0x81, 0xdc, 0x8d, 0x8b, 0xb3, 0x41, 0x2e, 0xb2, 0x22, 0xde, 0xcc, 0xe2, 0x94, 0x0d, 0x70,
	0x92, 0x70, 0x81, 0x05, 0xe3, 0x49, 0xae, 0xb2, 0xfe, 0x17, 0x13, 0xf6, 0x9f, 0x63, 0x11, 0x9f,
	0x47, 0x0a, 0xee, 0x54, 0xa2, 0x45, 0xf4, 0xa2, 0xa0, 0xb9, 0x40, 0x3b, 0x60, 0x32, 0xe2, 0x18,
	0x9e, 0x11, 0x58, 0x91, 0xc9, 0x08, 0xfa, 0x1f, 0x3a, 0x84, 0xcf, 0x30, 0x4b, 0x46, 0x8c, 0x38,
	0xa6, 0x0c, 0xb7, 0x55, 0xe0, 0x98, 0x20, 0x04, 0x8d, 0x04, 0xcf, 0xa8, 0x63, 0x79, 0x46, 0xd0,
	0x89, 0xe4, 0x1a, 0x79, 0xd0, 0x25, 0x34, 0x8f, 0x33, 0x96, 0x2e, 0x40, 0x9d, 0x86, 0x4c, 0x5d,
	0x0e, 0x2d, 0xbe, 0x12, 0xf3, 0x94, 0x3a, 0xb6, 0x67, 0x04, 0x76, 0x24, 0xd7, 0x28, 0x84, 0xa6,
	0x62, 0xed, 0x34, 0x3d, 0x23, 0xe8, 0x0e, 0xf7, 0x42, 0xc5, 0x21, 0xac, 0x18, 0x86, 0x2f, 0xf1,
	0xb4, 0xa0, 0x51, 0x79, 0x0a, 0xdd, 0x87, 0x56, 0x8a, 0xe7, 0x53, 0x8e, 0x89, 0xd3, 0xba, 0xf6,
	0x83, 0xea, 0x18, 0xea, 0x83, 0x4d, 0xe8, 0xb8, 0x98, 0x38, 0x6d, 0xcf, 0x08, 0xda, 0x91, 0xda,
	0xa0, 0x3d, 0x68, 0x9e, 0x31, 0x3a, 0x25, 0xb9, 0xd3, 0xf1, 0xac, 0xa0, 0x13, 0x95, 0x3b, 0xff,
	0x18, 0xdc, 0xa7, 0x74, 0x4a, 0x05, 0xad, 0x15, 0x69, 0x4d, 0x14, 0x63, 0x43, 0x14, 0xa5, 0xa0,
	0x59, 0x29, 0xe8, 0x7f, 0x34, 0xc1, 0x7d, 0x91, 0x12, 0xac, 0xa9, 0xf5, 0x67, 0x09, 0xee, 0x3f,
	0x03, 0x27, 0xa2, 0x98, 0xfc, 0xbe, 0xac, 0x18, 0xdc, 0x53, 0x8a, 0x33, 0xcd, 0x35, 0xbe, 0xb6,
	0x14, 0x82, 0x46, 0xce, 0xde, 0x52, 0x59, 0xcc, 0x8e, 0xe4, 0x7a, 0x11, 0x4b, 0xf1, 0x44, 0x29,
	0x6b, 0x47, 0x72, 0xed, 0xff, 0x30, 0xc0, 0x7d, 0x92, 0x51, 0xfc, 0x2b, 0xb7, 0xa0, 0x72, 0xca,
	0xd4, 0x3b, 0x65, 0xe9, 0x9d, 0x6a, 0xd4, 0x3a, 0x65, 0x6f, 0xeb, 0x54, 0x73, 0x4b, 0xa7, 0x5a,
	0x97, 0x9d, 0xfa, 0x6c, 0xc1, 0xdf, 0x6b, 0xbc, 0xb7, 0xbb, 0xaa, 0xb7, 0x00, 0x62, 0xa9, 0x1d,
	0x19, 0x61, 0x21, 0xb9, 0x5a, 0x51, 0xa7, 0x8c, 0x3c, 0x16, 0xe8, 0xde, 0x2a, 0x3d, 0x9e, 0x4b,
	0xbe, 0xdd, 0xe1, 0x4e, 0xa8, 0xde, 0xba, 0xf0, 0x84, 0xf3, 0xd7, 0x45, 0xba, 0x3c, 0x7e, 0x34,
	0x5f, 0x54, 0x2b, 0x64, 0x0f, 0xc9, 0x6a, 0xb6, 0xaa, 0x56, 0x46, 0x54, 0xb5, 0x2a, 0x3d, 0x9e,
	0x97, 0xb4, 0xaf, 0x54, 0x2b, 0x4f, 0x1c, 0xcd, 0x97, 0xe6, 0xb4, 0xf4, 0xe6, 0xb4, 0xf5, 0xe6,
	0x74, 0x6a, 0xcd, 0x81, 0x6d, 0xcd, 0xe9, 0x6e, 0x69, 0xce, 0x5f, 0x97, 0xcd, 0x79, 0x04, 0xbb,
	0x27, 0x2c, 0x17, 0xeb, 0xfe, 0xdc, 0x05, 0x9b, 0x09, 0x3a, 0xcb, 0x1d, 0xc3, 0xb3, 0x82, 0xee,
	0xf0, 0xdf, 0x4a, 0x80, 0xf5, 0xdb, 0xab, 0xce, 0x0c, 0xbf, 0xda, 0xd0, 0x5f, 0x4b, 0x9c, 0xd2,
	0xec, 0x0d, 0x8b, 0x29, 0x9a, 0x42, 0xaf, 0xe6, 0xd2, 0x23, 0xbf, 0xaa, 0xa6, 0xef, 0x08, 0xb7,
	0x1e, 0xd1, 0x77, 0x3f, 0x7c, 0xfb, 0xfe, 0xc9, 0xec, 0xfb, 0xff, 0x0c, 0xca, 0x09, 0x37, 0x50,
	0x6a, 0x3c, 0x34, 0x0e, 0xd1, 0x0c, 0x7a, 0x35, 0x6d, 0xbc, 0x42, 0xd3, 0xf7, 0xb8, 0xbb, 0xbf,
	0x34, 0x78, 0x53, 0x09, 0xff, 0x3f, 0x89, 0xb8, 0x8b, 0x36, 0x11, 0xd1, 0x2b, 0xd8, 0xbd, 0xf2,
	0xfc, 0x20, 0x6f, 0xf9, 0xdb, 0x9a, 0x97, 0x49, 0x47, 0xec, 0x40, 0xc2, 0xec, 0xa1, 0xfe, 0x06,
	0xcc, 0xe0, 0x1d, 0x23, 0xef, 0xd1, 0x05, 0xf4, 0x6a, 0xde, 0xfd, 0x15, 0x35, 0xfd, 0x50, 0xd0,
	0xe1, 0xdd, 0x96, 0x78, 0xfb, 0x6e, 0x2d, 0xde, 0x42, 0x4d, 0x0e, 0xe8, 0xea, 0x68, 0x47, 0x77,
	0xaa, 0x6a, 0xda, 0xb1, 0x7f, 0x03, 0xe0, 0x50, 0x0b, 0x98, 0x40, 0xaf, 0x66, 0x4e, 0xae, 0x38,
	0xea, 0x87, 0xe8, 0x0d, 0x9a, 0x1e, 0xd6, 0x42, 0x8e, 0x9b, 0xb2, 0x4d, 0x1e, 0xfc, 0x0c, 0x00,
	0x00, 0xff, 0xff, 0x33, 0x44, 0x17, 0xaa, 0x30, 0x09, 0x00, 0x00,
}

// Reference imports to suppress errors if they are not otherwise used.
var _ context.Context
var _ grpc.ClientConn

// This is a compile-time assertion to ensure that this generated file
// is compatible with the grpc package it is being compiled against.
const _ = grpc.SupportPackageIsVersion4

// RoutingSchemaServiceClient is the client API for RoutingSchemaService service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://godoc.org/google.golang.org/grpc#ClientConn.NewStream.
type RoutingSchemaServiceClient interface {
	// Create RoutingSchema
	CreateRoutingSchema(ctx context.Context, in *CreateRoutingSchemaRequest, opts ...grpc.CallOption) (*RoutingSchema, error)
	// List RoutingSchema
	SearchRoutingSchema(ctx context.Context, in *SearchRoutingSchemaRequest, opts ...grpc.CallOption) (*ListRoutingSchema, error)
	// RoutingSchema item
	ReadRoutingSchema(ctx context.Context, in *ReadRoutingSchemaRequest, opts ...grpc.CallOption) (*RoutingSchema, error)
	// Update RoutingSchema
	UpdateRoutingSchema(ctx context.Context, in *UpdateRoutingSchemaRequest, opts ...grpc.CallOption) (*RoutingSchema, error)
	// Patch RoutingSchema
	PatchRoutingSchema(ctx context.Context, in *PatchRoutingSchemaRequest, opts ...grpc.CallOption) (*RoutingSchema, error)
	// Remove RoutingSchema
	DeleteRoutingSchema(ctx context.Context, in *DeleteRoutingSchemaRequest, opts ...grpc.CallOption) (*RoutingSchema, error)
}

type routingSchemaServiceClient struct {
	cc *grpc.ClientConn
}

func NewRoutingSchemaServiceClient(cc *grpc.ClientConn) RoutingSchemaServiceClient {
	return &routingSchemaServiceClient{cc}
}

func (c *routingSchemaServiceClient) CreateRoutingSchema(ctx context.Context, in *CreateRoutingSchemaRequest, opts ...grpc.CallOption) (*RoutingSchema, error) {
	out := new(RoutingSchema)
	err := c.cc.Invoke(ctx, "/engine.RoutingSchemaService/CreateRoutingSchema", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *routingSchemaServiceClient) SearchRoutingSchema(ctx context.Context, in *SearchRoutingSchemaRequest, opts ...grpc.CallOption) (*ListRoutingSchema, error) {
	out := new(ListRoutingSchema)
	err := c.cc.Invoke(ctx, "/engine.RoutingSchemaService/SearchRoutingSchema", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *routingSchemaServiceClient) ReadRoutingSchema(ctx context.Context, in *ReadRoutingSchemaRequest, opts ...grpc.CallOption) (*RoutingSchema, error) {
	out := new(RoutingSchema)
	err := c.cc.Invoke(ctx, "/engine.RoutingSchemaService/ReadRoutingSchema", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *routingSchemaServiceClient) UpdateRoutingSchema(ctx context.Context, in *UpdateRoutingSchemaRequest, opts ...grpc.CallOption) (*RoutingSchema, error) {
	out := new(RoutingSchema)
	err := c.cc.Invoke(ctx, "/engine.RoutingSchemaService/UpdateRoutingSchema", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *routingSchemaServiceClient) PatchRoutingSchema(ctx context.Context, in *PatchRoutingSchemaRequest, opts ...grpc.CallOption) (*RoutingSchema, error) {
	out := new(RoutingSchema)
	err := c.cc.Invoke(ctx, "/engine.RoutingSchemaService/PatchRoutingSchema", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *routingSchemaServiceClient) DeleteRoutingSchema(ctx context.Context, in *DeleteRoutingSchemaRequest, opts ...grpc.CallOption) (*RoutingSchema, error) {
	out := new(RoutingSchema)
	err := c.cc.Invoke(ctx, "/engine.RoutingSchemaService/DeleteRoutingSchema", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// RoutingSchemaServiceServer is the server API for RoutingSchemaService service.
type RoutingSchemaServiceServer interface {
	// Create RoutingSchema
	CreateRoutingSchema(context.Context, *CreateRoutingSchemaRequest) (*RoutingSchema, error)
	// List RoutingSchema
	SearchRoutingSchema(context.Context, *SearchRoutingSchemaRequest) (*ListRoutingSchema, error)
	// RoutingSchema item
	ReadRoutingSchema(context.Context, *ReadRoutingSchemaRequest) (*RoutingSchema, error)
	// Update RoutingSchema
	UpdateRoutingSchema(context.Context, *UpdateRoutingSchemaRequest) (*RoutingSchema, error)
	// Patch RoutingSchema
	PatchRoutingSchema(context.Context, *PatchRoutingSchemaRequest) (*RoutingSchema, error)
	// Remove RoutingSchema
	DeleteRoutingSchema(context.Context, *DeleteRoutingSchemaRequest) (*RoutingSchema, error)
}

// UnimplementedRoutingSchemaServiceServer can be embedded to have forward compatible implementations.
type UnimplementedRoutingSchemaServiceServer struct {
}

func (*UnimplementedRoutingSchemaServiceServer) CreateRoutingSchema(ctx context.Context, req *CreateRoutingSchemaRequest) (*RoutingSchema, error) {
	return nil, status.Errorf(codes.Unimplemented, "method CreateRoutingSchema not implemented")
}
func (*UnimplementedRoutingSchemaServiceServer) SearchRoutingSchema(ctx context.Context, req *SearchRoutingSchemaRequest) (*ListRoutingSchema, error) {
	return nil, status.Errorf(codes.Unimplemented, "method SearchRoutingSchema not implemented")
}
func (*UnimplementedRoutingSchemaServiceServer) ReadRoutingSchema(ctx context.Context, req *ReadRoutingSchemaRequest) (*RoutingSchema, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ReadRoutingSchema not implemented")
}
func (*UnimplementedRoutingSchemaServiceServer) UpdateRoutingSchema(ctx context.Context, req *UpdateRoutingSchemaRequest) (*RoutingSchema, error) {
	return nil, status.Errorf(codes.Unimplemented, "method UpdateRoutingSchema not implemented")
}
func (*UnimplementedRoutingSchemaServiceServer) PatchRoutingSchema(ctx context.Context, req *PatchRoutingSchemaRequest) (*RoutingSchema, error) {
	return nil, status.Errorf(codes.Unimplemented, "method PatchRoutingSchema not implemented")
}
func (*UnimplementedRoutingSchemaServiceServer) DeleteRoutingSchema(ctx context.Context, req *DeleteRoutingSchemaRequest) (*RoutingSchema, error) {
	return nil, status.Errorf(codes.Unimplemented, "method DeleteRoutingSchema not implemented")
}

func RegisterRoutingSchemaServiceServer(s *grpc.Server, srv RoutingSchemaServiceServer) {
	s.RegisterService(&_RoutingSchemaService_serviceDesc, srv)
}

func _RoutingSchemaService_CreateRoutingSchema_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CreateRoutingSchemaRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(RoutingSchemaServiceServer).CreateRoutingSchema(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/engine.RoutingSchemaService/CreateRoutingSchema",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(RoutingSchemaServiceServer).CreateRoutingSchema(ctx, req.(*CreateRoutingSchemaRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _RoutingSchemaService_SearchRoutingSchema_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(SearchRoutingSchemaRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(RoutingSchemaServiceServer).SearchRoutingSchema(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/engine.RoutingSchemaService/SearchRoutingSchema",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(RoutingSchemaServiceServer).SearchRoutingSchema(ctx, req.(*SearchRoutingSchemaRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _RoutingSchemaService_ReadRoutingSchema_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ReadRoutingSchemaRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(RoutingSchemaServiceServer).ReadRoutingSchema(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/engine.RoutingSchemaService/ReadRoutingSchema",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(RoutingSchemaServiceServer).ReadRoutingSchema(ctx, req.(*ReadRoutingSchemaRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _RoutingSchemaService_UpdateRoutingSchema_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateRoutingSchemaRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(RoutingSchemaServiceServer).UpdateRoutingSchema(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/engine.RoutingSchemaService/UpdateRoutingSchema",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(RoutingSchemaServiceServer).UpdateRoutingSchema(ctx, req.(*UpdateRoutingSchemaRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _RoutingSchemaService_PatchRoutingSchema_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(PatchRoutingSchemaRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(RoutingSchemaServiceServer).PatchRoutingSchema(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/engine.RoutingSchemaService/PatchRoutingSchema",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(RoutingSchemaServiceServer).PatchRoutingSchema(ctx, req.(*PatchRoutingSchemaRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _RoutingSchemaService_DeleteRoutingSchema_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(DeleteRoutingSchemaRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(RoutingSchemaServiceServer).DeleteRoutingSchema(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/engine.RoutingSchemaService/DeleteRoutingSchema",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(RoutingSchemaServiceServer).DeleteRoutingSchema(ctx, req.(*DeleteRoutingSchemaRequest))
	}
	return interceptor(ctx, in, info, handler)
}

var _RoutingSchemaService_serviceDesc = grpc.ServiceDesc{
	ServiceName: "engine.RoutingSchemaService",
	HandlerType: (*RoutingSchemaServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "CreateRoutingSchema",
			Handler:    _RoutingSchemaService_CreateRoutingSchema_Handler,
		},
		{
			MethodName: "SearchRoutingSchema",
			Handler:    _RoutingSchemaService_SearchRoutingSchema_Handler,
		},
		{
			MethodName: "ReadRoutingSchema",
			Handler:    _RoutingSchemaService_ReadRoutingSchema_Handler,
		},
		{
			MethodName: "UpdateRoutingSchema",
			Handler:    _RoutingSchemaService_UpdateRoutingSchema_Handler,
		},
		{
			MethodName: "PatchRoutingSchema",
			Handler:    _RoutingSchemaService_PatchRoutingSchema_Handler,
		},
		{
			MethodName: "DeleteRoutingSchema",
			Handler:    _RoutingSchemaService_DeleteRoutingSchema_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "acr_routing_schema.proto",
}
