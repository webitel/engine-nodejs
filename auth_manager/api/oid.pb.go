// Code generated by protoc-gen-go. DO NOT EDIT.
// source: oid.proto

package api

import (
	fmt "fmt"
	proto "github.com/golang/protobuf/proto"
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

//
type ObjectId struct {
	Id                   int64    `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	Name                 string   `protobuf:"bytes,2,opt,name=name,proto3" json:"name,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *ObjectId) Reset()         { *m = ObjectId{} }
func (m *ObjectId) String() string { return proto.CompactTextString(m) }
func (*ObjectId) ProtoMessage()    {}
func (*ObjectId) Descriptor() ([]byte, []int) {
	return fileDescriptor_71c9348c8725261a, []int{0}
}

func (m *ObjectId) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_ObjectId.Unmarshal(m, b)
}
func (m *ObjectId) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_ObjectId.Marshal(b, m, deterministic)
}
func (m *ObjectId) XXX_Merge(src proto.Message) {
	xxx_messageInfo_ObjectId.Merge(m, src)
}
func (m *ObjectId) XXX_Size() int {
	return xxx_messageInfo_ObjectId.Size(m)
}
func (m *ObjectId) XXX_DiscardUnknown() {
	xxx_messageInfo_ObjectId.DiscardUnknown(m)
}

var xxx_messageInfo_ObjectId proto.InternalMessageInfo

func (m *ObjectId) GetId() int64 {
	if m != nil {
		return m.Id
	}
	return 0
}

func (m *ObjectId) GetName() string {
	if m != nil {
		return m.Name
	}
	return ""
}

func init() {
	proto.RegisterType((*ObjectId)(nil), "api.ObjectId")
}

func init() { proto.RegisterFile("oid.proto", fileDescriptor_71c9348c8725261a) }

var fileDescriptor_71c9348c8725261a = []byte{
	// 90 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0xe2, 0xe2, 0xcc, 0xcf, 0x4c, 0xd1,
	0x2b, 0x28, 0xca, 0x2f, 0xc9, 0x17, 0x62, 0x4e, 0x2c, 0xc8, 0x54, 0xd2, 0xe3, 0xe2, 0xf0, 0x4f,
	0xca, 0x4a, 0x4d, 0x2e, 0xf1, 0x4c, 0x11, 0xe2, 0xe3, 0x62, 0xca, 0x4c, 0x91, 0x60, 0x54, 0x60,
	0xd4, 0x60, 0x0e, 0x62, 0xca, 0x4c, 0x11, 0x12, 0xe2, 0x62, 0xc9, 0x4b, 0xcc, 0x4d, 0x95, 0x60,
	0x52, 0x60, 0xd4, 0xe0, 0x0c, 0x02, 0xb3, 0x93, 0xd8, 0xc0, 0x7a, 0x8d, 0x01, 0x01, 0x00, 0x00,
	0xff, 0xff, 0x38, 0xfa, 0xf4, 0x43, 0x48, 0x00, 0x00, 0x00,
}