// Code generated by protoc-gen-go. DO NOT EDIT.
// source: skill.proto

package engine

import (
	context "context"
	fmt "fmt"
	proto "github.com/golang/protobuf/proto"
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

type ReadSkillRequest struct {
	Id                   int64    `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	DomainId             int64    `protobuf:"varint,2,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *ReadSkillRequest) Reset()         { *m = ReadSkillRequest{} }
func (m *ReadSkillRequest) String() string { return proto.CompactTextString(m) }
func (*ReadSkillRequest) ProtoMessage()    {}
func (*ReadSkillRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_dd709e691a520876, []int{0}
}

func (m *ReadSkillRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_ReadSkillRequest.Unmarshal(m, b)
}
func (m *ReadSkillRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_ReadSkillRequest.Marshal(b, m, deterministic)
}
func (m *ReadSkillRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_ReadSkillRequest.Merge(m, src)
}
func (m *ReadSkillRequest) XXX_Size() int {
	return xxx_messageInfo_ReadSkillRequest.Size(m)
}
func (m *ReadSkillRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_ReadSkillRequest.DiscardUnknown(m)
}

var xxx_messageInfo_ReadSkillRequest proto.InternalMessageInfo

func (m *ReadSkillRequest) GetId() int64 {
	if m != nil {
		return m.Id
	}
	return 0
}

func (m *ReadSkillRequest) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

type DeleteSkillRequest struct {
	Id                   int64    `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	DomainId             int64    `protobuf:"varint,2,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *DeleteSkillRequest) Reset()         { *m = DeleteSkillRequest{} }
func (m *DeleteSkillRequest) String() string { return proto.CompactTextString(m) }
func (*DeleteSkillRequest) ProtoMessage()    {}
func (*DeleteSkillRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_dd709e691a520876, []int{1}
}

func (m *DeleteSkillRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_DeleteSkillRequest.Unmarshal(m, b)
}
func (m *DeleteSkillRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_DeleteSkillRequest.Marshal(b, m, deterministic)
}
func (m *DeleteSkillRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_DeleteSkillRequest.Merge(m, src)
}
func (m *DeleteSkillRequest) XXX_Size() int {
	return xxx_messageInfo_DeleteSkillRequest.Size(m)
}
func (m *DeleteSkillRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_DeleteSkillRequest.DiscardUnknown(m)
}

var xxx_messageInfo_DeleteSkillRequest proto.InternalMessageInfo

func (m *DeleteSkillRequest) GetId() int64 {
	if m != nil {
		return m.Id
	}
	return 0
}

func (m *DeleteSkillRequest) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

type SearchSkillRequest struct {
	DomainId             int64    `protobuf:"varint,1,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	Size                 int32    `protobuf:"varint,2,opt,name=size,proto3" json:"size,omitempty"`
	Page                 int32    `protobuf:"varint,3,opt,name=page,proto3" json:"page,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *SearchSkillRequest) Reset()         { *m = SearchSkillRequest{} }
func (m *SearchSkillRequest) String() string { return proto.CompactTextString(m) }
func (*SearchSkillRequest) ProtoMessage()    {}
func (*SearchSkillRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_dd709e691a520876, []int{2}
}

func (m *SearchSkillRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_SearchSkillRequest.Unmarshal(m, b)
}
func (m *SearchSkillRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_SearchSkillRequest.Marshal(b, m, deterministic)
}
func (m *SearchSkillRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_SearchSkillRequest.Merge(m, src)
}
func (m *SearchSkillRequest) XXX_Size() int {
	return xxx_messageInfo_SearchSkillRequest.Size(m)
}
func (m *SearchSkillRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_SearchSkillRequest.DiscardUnknown(m)
}

var xxx_messageInfo_SearchSkillRequest proto.InternalMessageInfo

func (m *SearchSkillRequest) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

func (m *SearchSkillRequest) GetSize() int32 {
	if m != nil {
		return m.Size
	}
	return 0
}

func (m *SearchSkillRequest) GetPage() int32 {
	if m != nil {
		return m.Page
	}
	return 0
}

type CreateSkillRequest struct {
	DomainId             int64    `protobuf:"varint,1,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	Name                 string   `protobuf:"bytes,2,opt,name=name,proto3" json:"name,omitempty"`
	Description          string   `protobuf:"bytes,3,opt,name=description,proto3" json:"description,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *CreateSkillRequest) Reset()         { *m = CreateSkillRequest{} }
func (m *CreateSkillRequest) String() string { return proto.CompactTextString(m) }
func (*CreateSkillRequest) ProtoMessage()    {}
func (*CreateSkillRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_dd709e691a520876, []int{3}
}

func (m *CreateSkillRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_CreateSkillRequest.Unmarshal(m, b)
}
func (m *CreateSkillRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_CreateSkillRequest.Marshal(b, m, deterministic)
}
func (m *CreateSkillRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_CreateSkillRequest.Merge(m, src)
}
func (m *CreateSkillRequest) XXX_Size() int {
	return xxx_messageInfo_CreateSkillRequest.Size(m)
}
func (m *CreateSkillRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_CreateSkillRequest.DiscardUnknown(m)
}

var xxx_messageInfo_CreateSkillRequest proto.InternalMessageInfo

func (m *CreateSkillRequest) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

func (m *CreateSkillRequest) GetName() string {
	if m != nil {
		return m.Name
	}
	return ""
}

func (m *CreateSkillRequest) GetDescription() string {
	if m != nil {
		return m.Description
	}
	return ""
}

type UpdateSkillRequest struct {
	Id                   int64    `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	DomainId             int64    `protobuf:"varint,2,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	Name                 string   `protobuf:"bytes,3,opt,name=name,proto3" json:"name,omitempty"`
	Description          string   `protobuf:"bytes,4,opt,name=description,proto3" json:"description,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *UpdateSkillRequest) Reset()         { *m = UpdateSkillRequest{} }
func (m *UpdateSkillRequest) String() string { return proto.CompactTextString(m) }
func (*UpdateSkillRequest) ProtoMessage()    {}
func (*UpdateSkillRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_dd709e691a520876, []int{4}
}

func (m *UpdateSkillRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_UpdateSkillRequest.Unmarshal(m, b)
}
func (m *UpdateSkillRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_UpdateSkillRequest.Marshal(b, m, deterministic)
}
func (m *UpdateSkillRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_UpdateSkillRequest.Merge(m, src)
}
func (m *UpdateSkillRequest) XXX_Size() int {
	return xxx_messageInfo_UpdateSkillRequest.Size(m)
}
func (m *UpdateSkillRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_UpdateSkillRequest.DiscardUnknown(m)
}

var xxx_messageInfo_UpdateSkillRequest proto.InternalMessageInfo

func (m *UpdateSkillRequest) GetId() int64 {
	if m != nil {
		return m.Id
	}
	return 0
}

func (m *UpdateSkillRequest) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

func (m *UpdateSkillRequest) GetName() string {
	if m != nil {
		return m.Name
	}
	return ""
}

func (m *UpdateSkillRequest) GetDescription() string {
	if m != nil {
		return m.Description
	}
	return ""
}

type Skill struct {
	Id                   int64    `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	DomainId             int64    `protobuf:"varint,2,opt,name=domain_id,json=domainId,proto3" json:"domain_id,omitempty"`
	Name                 string   `protobuf:"bytes,3,opt,name=name,proto3" json:"name,omitempty"`
	Description          string   `protobuf:"bytes,4,opt,name=description,proto3" json:"description,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *Skill) Reset()         { *m = Skill{} }
func (m *Skill) String() string { return proto.CompactTextString(m) }
func (*Skill) ProtoMessage()    {}
func (*Skill) Descriptor() ([]byte, []int) {
	return fileDescriptor_dd709e691a520876, []int{5}
}

func (m *Skill) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_Skill.Unmarshal(m, b)
}
func (m *Skill) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_Skill.Marshal(b, m, deterministic)
}
func (m *Skill) XXX_Merge(src proto.Message) {
	xxx_messageInfo_Skill.Merge(m, src)
}
func (m *Skill) XXX_Size() int {
	return xxx_messageInfo_Skill.Size(m)
}
func (m *Skill) XXX_DiscardUnknown() {
	xxx_messageInfo_Skill.DiscardUnknown(m)
}

var xxx_messageInfo_Skill proto.InternalMessageInfo

func (m *Skill) GetId() int64 {
	if m != nil {
		return m.Id
	}
	return 0
}

func (m *Skill) GetDomainId() int64 {
	if m != nil {
		return m.DomainId
	}
	return 0
}

func (m *Skill) GetName() string {
	if m != nil {
		return m.Name
	}
	return ""
}

func (m *Skill) GetDescription() string {
	if m != nil {
		return m.Description
	}
	return ""
}

type ListSkill struct {
	Items                []*Skill `protobuf:"bytes,1,rep,name=items,proto3" json:"items,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *ListSkill) Reset()         { *m = ListSkill{} }
func (m *ListSkill) String() string { return proto.CompactTextString(m) }
func (*ListSkill) ProtoMessage()    {}
func (*ListSkill) Descriptor() ([]byte, []int) {
	return fileDescriptor_dd709e691a520876, []int{6}
}

func (m *ListSkill) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_ListSkill.Unmarshal(m, b)
}
func (m *ListSkill) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_ListSkill.Marshal(b, m, deterministic)
}
func (m *ListSkill) XXX_Merge(src proto.Message) {
	xxx_messageInfo_ListSkill.Merge(m, src)
}
func (m *ListSkill) XXX_Size() int {
	return xxx_messageInfo_ListSkill.Size(m)
}
func (m *ListSkill) XXX_DiscardUnknown() {
	xxx_messageInfo_ListSkill.DiscardUnknown(m)
}

var xxx_messageInfo_ListSkill proto.InternalMessageInfo

func (m *ListSkill) GetItems() []*Skill {
	if m != nil {
		return m.Items
	}
	return nil
}

func init() {
	proto.RegisterType((*ReadSkillRequest)(nil), "engine.ReadSkillRequest")
	proto.RegisterType((*DeleteSkillRequest)(nil), "engine.DeleteSkillRequest")
	proto.RegisterType((*SearchSkillRequest)(nil), "engine.SearchSkillRequest")
	proto.RegisterType((*CreateSkillRequest)(nil), "engine.CreateSkillRequest")
	proto.RegisterType((*UpdateSkillRequest)(nil), "engine.UpdateSkillRequest")
	proto.RegisterType((*Skill)(nil), "engine.Skill")
	proto.RegisterType((*ListSkill)(nil), "engine.ListSkill")
}

func init() { proto.RegisterFile("skill.proto", fileDescriptor_dd709e691a520876) }

var fileDescriptor_dd709e691a520876 = []byte{
	// 425 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0xbc, 0x94, 0xcf, 0xaa, 0xd3, 0x40,
	0x14, 0xc6, 0x49, 0x72, 0x7b, 0x31, 0x27, 0x2a, 0x7a, 0x44, 0x08, 0xb9, 0x2a, 0x21, 0x77, 0x73,
	0xe9, 0xa2, 0x91, 0xba, 0x73, 0x23, 0xa2, 0x1b, 0xc1, 0x55, 0x8a, 0x62, 0x05, 0x29, 0x63, 0xe6,
	0x10, 0x47, 0xd3, 0x49, 0xcc, 0x8c, 0x0a, 0x8a, 0x1b, 0x5f, 0xc1, 0x47, 0x13, 0x7c, 0x02, 0x1f,
	0x44, 0x32, 0x43, 0xdb, 0xfc, 0x69, 0x10, 0x14, 0xdc, 0x0d, 0xdf, 0xf4, 0xfc, 0xbe, 0xd3, 0x33,
	0xdf, 0x09, 0x04, 0xea, 0x9d, 0x28, 0xcb, 0x45, 0xdd, 0x54, 0xba, 0xc2, 0x53, 0x92, 0x85, 0x90,
	0x14, 0xdd, 0x2a, 0xaa, 0xaa, 0x28, 0x29, 0x65, 0xb5, 0x48, 0x99, 0x94, 0x95, 0x66, 0x5a, 0x54,
	0x52, 0xd9, 0x5f, 0x25, 0x0f, 0xe0, 0x5a, 0x46, 0x8c, 0xaf, 0xda, 0xc2, 0x8c, 0xde, 0x7f, 0x20,
	0xa5, 0xf1, 0x2a, 0xb8, 0x82, 0x87, 0x4e, 0xec, 0x5c, 0x78, 0x99, 0x2b, 0x38, 0x9e, 0x81, 0xcf,
	0xab, 0x2d, 0x13, 0x72, 0x23, 0x78, 0xe8, 0x1a, 0xf9, 0x92, 0x15, 0x9e, 0xf0, 0xe4, 0x21, 0xe0,
	0x63, 0x2a, 0x49, 0xd3, 0xdf, 0x23, 0xd6, 0x80, 0x2b, 0x62, 0x4d, 0xfe, 0xa6, 0x87, 0xe8, 0x95,
	0x38, 0xfd, 0x12, 0x44, 0x38, 0x51, 0xe2, 0x33, 0x19, 0xd4, 0x2c, 0x33, 0xe7, 0x56, 0xab, 0x59,
	0x41, 0xa1, 0x67, 0xb5, 0xf6, 0x9c, 0x14, 0x80, 0x8f, 0x1a, 0x62, 0x83, 0xee, 0xfe, 0x84, 0x96,
	0x6c, 0x6b, 0xd1, 0x7e, 0x66, 0xce, 0x18, 0x43, 0xc0, 0x49, 0xe5, 0x8d, 0xa8, 0xdb, 0xd9, 0x19,
	0x07, 0x3f, 0xeb, 0x4a, 0xc9, 0x27, 0xc0, 0x67, 0x35, 0x67, 0xff, 0x30, 0x86, 0xbd, 0xb1, 0x37,
	0x6d, 0x7c, 0x32, 0x36, 0x7e, 0x0b, 0x33, 0x63, 0xf9, 0x3f, 0xbc, 0xee, 0x82, 0xff, 0x54, 0x28,
	0x6d, 0xfd, 0xce, 0x61, 0x26, 0x34, 0x6d, 0x55, 0xe8, 0xc4, 0xde, 0x45, 0xb0, 0xbc, 0xb2, 0xb0,
	0x79, 0x5b, 0xd8, 0x01, 0xd8, 0xbb, 0xe5, 0x4f, 0x0f, 0x2e, 0x1b, 0x61, 0x45, 0xcd, 0x47, 0x91,
	0x13, 0xbe, 0x80, 0xa0, 0xf3, 0x20, 0x18, 0xed, 0xaa, 0xc6, 0xaf, 0x14, 0xf5, 0x89, 0xc9, 0x9d,
	0x6f, 0x3f, 0x7e, 0x7d, 0x77, 0xc3, 0xe4, 0x46, 0x9a, 0xb3, 0xb2, 0xdc, 0xe4, 0x24, 0x35, 0x35,
	0xa9, 0x49, 0xbc, 0xba, 0xef, 0xcc, 0x71, 0x0d, 0x41, 0x27, 0x45, 0x07, 0xf2, 0x38, 0x5a, 0xd1,
	0xf5, 0xdd, 0xdd, 0xfe, 0xdf, 0x24, 0x67, 0x86, 0x7e, 0x13, 0x8f, 0xd1, 0xf1, 0x39, 0xf8, 0xfb,
	0x25, 0xc1, 0x70, 0x57, 0x3c, 0xdc, 0x9b, 0x61, 0xc3, 0xb1, 0x41, 0x46, 0x18, 0x1e, 0x41, 0xa6,
	0x5f, 0x04, 0xff, 0x8a, 0xaf, 0x20, 0xe8, 0x84, 0xe6, 0xd0, 0xf2, 0x38, 0x49, 0x43, 0xf6, 0xb9,
	0x61, 0xdf, 0x8e, 0x26, 0xd9, 0xed, 0x44, 0x5e, 0x42, 0xd0, 0x59, 0xcd, 0x03, 0x7e, 0xbc, 0xaf,
	0x13, 0xad, 0xcf, 0x27, 0xf1, 0xaf, 0x4f, 0xcd, 0xe7, 0xe3, 0xde, 0xef, 0x00, 0x00, 0x00, 0xff,
	0xff, 0x20, 0x7e, 0x5c, 0xa2, 0x73, 0x04, 0x00, 0x00,
}

// Reference imports to suppress errors if they are not otherwise used.
var _ context.Context
var _ grpc.ClientConn

// This is a compile-time assertion to ensure that this generated file
// is compatible with the grpc package it is being compiled against.
const _ = grpc.SupportPackageIsVersion4

// SkillServiceClient is the client API for SkillService service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://godoc.org/google.golang.org/grpc#ClientConn.NewStream.
type SkillServiceClient interface {
	// Create Skill
	CreateSkill(ctx context.Context, in *CreateSkillRequest, opts ...grpc.CallOption) (*Skill, error)
	// List of Skill
	SearchSkill(ctx context.Context, in *SearchSkillRequest, opts ...grpc.CallOption) (*ListSkill, error)
	// Skill item
	ReadSkill(ctx context.Context, in *ReadSkillRequest, opts ...grpc.CallOption) (*Skill, error)
	// Update Skill
	UpdateSkill(ctx context.Context, in *UpdateSkillRequest, opts ...grpc.CallOption) (*Skill, error)
	// Remove Skill
	DeleteSkill(ctx context.Context, in *DeleteSkillRequest, opts ...grpc.CallOption) (*Skill, error)
}

type skillServiceClient struct {
	cc *grpc.ClientConn
}

func NewSkillServiceClient(cc *grpc.ClientConn) SkillServiceClient {
	return &skillServiceClient{cc}
}

func (c *skillServiceClient) CreateSkill(ctx context.Context, in *CreateSkillRequest, opts ...grpc.CallOption) (*Skill, error) {
	out := new(Skill)
	err := c.cc.Invoke(ctx, "/engine.SkillService/CreateSkill", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *skillServiceClient) SearchSkill(ctx context.Context, in *SearchSkillRequest, opts ...grpc.CallOption) (*ListSkill, error) {
	out := new(ListSkill)
	err := c.cc.Invoke(ctx, "/engine.SkillService/SearchSkill", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *skillServiceClient) ReadSkill(ctx context.Context, in *ReadSkillRequest, opts ...grpc.CallOption) (*Skill, error) {
	out := new(Skill)
	err := c.cc.Invoke(ctx, "/engine.SkillService/ReadSkill", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *skillServiceClient) UpdateSkill(ctx context.Context, in *UpdateSkillRequest, opts ...grpc.CallOption) (*Skill, error) {
	out := new(Skill)
	err := c.cc.Invoke(ctx, "/engine.SkillService/UpdateSkill", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *skillServiceClient) DeleteSkill(ctx context.Context, in *DeleteSkillRequest, opts ...grpc.CallOption) (*Skill, error) {
	out := new(Skill)
	err := c.cc.Invoke(ctx, "/engine.SkillService/DeleteSkill", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// SkillServiceServer is the server API for SkillService service.
type SkillServiceServer interface {
	// Create Skill
	CreateSkill(context.Context, *CreateSkillRequest) (*Skill, error)
	// List of Skill
	SearchSkill(context.Context, *SearchSkillRequest) (*ListSkill, error)
	// Skill item
	ReadSkill(context.Context, *ReadSkillRequest) (*Skill, error)
	// Update Skill
	UpdateSkill(context.Context, *UpdateSkillRequest) (*Skill, error)
	// Remove Skill
	DeleteSkill(context.Context, *DeleteSkillRequest) (*Skill, error)
}

// UnimplementedSkillServiceServer can be embedded to have forward compatible implementations.
type UnimplementedSkillServiceServer struct {
}

func (*UnimplementedSkillServiceServer) CreateSkill(ctx context.Context, req *CreateSkillRequest) (*Skill, error) {
	return nil, status.Errorf(codes.Unimplemented, "method CreateSkill not implemented")
}
func (*UnimplementedSkillServiceServer) SearchSkill(ctx context.Context, req *SearchSkillRequest) (*ListSkill, error) {
	return nil, status.Errorf(codes.Unimplemented, "method SearchSkill not implemented")
}
func (*UnimplementedSkillServiceServer) ReadSkill(ctx context.Context, req *ReadSkillRequest) (*Skill, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ReadSkill not implemented")
}
func (*UnimplementedSkillServiceServer) UpdateSkill(ctx context.Context, req *UpdateSkillRequest) (*Skill, error) {
	return nil, status.Errorf(codes.Unimplemented, "method UpdateSkill not implemented")
}
func (*UnimplementedSkillServiceServer) DeleteSkill(ctx context.Context, req *DeleteSkillRequest) (*Skill, error) {
	return nil, status.Errorf(codes.Unimplemented, "method DeleteSkill not implemented")
}

func RegisterSkillServiceServer(s *grpc.Server, srv SkillServiceServer) {
	s.RegisterService(&_SkillService_serviceDesc, srv)
}

func _SkillService_CreateSkill_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CreateSkillRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SkillServiceServer).CreateSkill(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/engine.SkillService/CreateSkill",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SkillServiceServer).CreateSkill(ctx, req.(*CreateSkillRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SkillService_SearchSkill_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(SearchSkillRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SkillServiceServer).SearchSkill(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/engine.SkillService/SearchSkill",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SkillServiceServer).SearchSkill(ctx, req.(*SearchSkillRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SkillService_ReadSkill_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ReadSkillRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SkillServiceServer).ReadSkill(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/engine.SkillService/ReadSkill",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SkillServiceServer).ReadSkill(ctx, req.(*ReadSkillRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SkillService_UpdateSkill_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateSkillRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SkillServiceServer).UpdateSkill(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/engine.SkillService/UpdateSkill",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SkillServiceServer).UpdateSkill(ctx, req.(*UpdateSkillRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SkillService_DeleteSkill_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(DeleteSkillRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SkillServiceServer).DeleteSkill(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/engine.SkillService/DeleteSkill",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SkillServiceServer).DeleteSkill(ctx, req.(*DeleteSkillRequest))
	}
	return interceptor(ctx, in, info, handler)
}

var _SkillService_serviceDesc = grpc.ServiceDesc{
	ServiceName: "engine.SkillService",
	HandlerType: (*SkillServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "CreateSkill",
			Handler:    _SkillService_CreateSkill_Handler,
		},
		{
			MethodName: "SearchSkill",
			Handler:    _SkillService_SearchSkill_Handler,
		},
		{
			MethodName: "ReadSkill",
			Handler:    _SkillService_ReadSkill_Handler,
		},
		{
			MethodName: "UpdateSkill",
			Handler:    _SkillService_UpdateSkill_Handler,
		},
		{
			MethodName: "DeleteSkill",
			Handler:    _SkillService_DeleteSkill_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "skill.proto",
}