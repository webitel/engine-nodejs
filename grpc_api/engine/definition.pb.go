// Code generated by protoc-gen-go. DO NOT EDIT.
// source: definition.proto

package engine

import (
	fmt "fmt"
	proto "github.com/golang/protobuf/proto"
	_ "github.com/grpc-ecosystem/grpc-gateway/protoc-gen-swagger/options"
	_ "google.golang.org/genproto/googleapis/api/annotations"
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

func init() { proto.RegisterFile("definition.proto", fileDescriptor_f461df25659d4bef) }

var fileDescriptor_f461df25659d4bef = []byte{
	// 322 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0x64, 0xd0, 0xc1, 0x4a, 0xc3, 0x30,
	0x1c, 0x06, 0x70, 0xd7, 0xd5, 0x6d, 0xc4, 0xc3, 0x66, 0x06, 0x1e, 0x8a, 0x87, 0x30, 0x10, 0x61,
	0xd8, 0xb4, 0x6e, 0xbb, 0xa8, 0x17, 0xe7, 0x45, 0x76, 0x10, 0xc6, 0x18, 0x28, 0xbb, 0x75, 0xed,
	0xdf, 0x36, 0xb8, 0xe5, 0x1f, 0x92, 0x74, 0xf3, 0x39, 0x3c, 0xfa, 0x3c, 0x1e, 0x7c, 0x2c, 0x69,
	0x3b, 0x71, 0xb2, 0x53, 0xe0, 0xcb, 0x8f, 0x2f, 0xe1, 0x23, 0x9d, 0x04, 0x5e, 0x85, 0x14, 0x56,
	0xa0, 0xe4, 0x4a, 0xa3, 0x45, 0xda, 0x00, 0x99, 0x0a, 0x09, 0xde, 0x79, 0x8a, 0x98, 0xae, 0x20,
	0x88, 0x94, 0x08, 0x22, 0x29, 0xd1, 0x46, 0x05, 0x32, 0x95, 0xf2, 0xae, 0xca, 0x23, 0xf6, 0x53,
	0x90, 0xbe, 0xd9, 0x46, 0x69, 0x0a, 0x3a, 0x40, 0x55, 0x8a, 0x43, 0xfd, 0xf0, 0xed, 0x7c, 0x8c,
	0xbf, 0x1c, 0xba, 0x20, 0xf4, 0x19, 0x96, 0xc2, 0xc2, 0x8a, 0x55, 0x8f, 0xb0, 0xf1, 0x74, 0xd2,
	0x1b, 0x92, 0xe6, 0x2e, 0xa5, 0xdd, 0xcc, 0x5a, 0x65, 0x6e, 0x83, 0x60, 0x5b, 0x05, 0x3c, 0xc6,
	0xb5, 0xd7, 0x35, 0xb9, 0x52, 0xa8, 0xed, 0xfd, 0x5e, 0xd8, 0x3f, 0x26, 0xf5, 0xa7, 0xc9, 0x7c,
	0xd0, 0x1a, 0x84, 0xd7, 0x37, 0x3c, 0xe4, 0xa1, 0xd7, 0x4e, 0x60, 0xc3, 0xf7, 0x44, 0xcf, 0x2d,
	0x7e, 0xde, 0x77, 0x6b, 0x4e, 0xdd, 0x9d, 0x4d, 0x49, 0x7d, 0x14, 0x0e, 0xe9, 0x84, 0x3c, 0xce,
	0xc0, 0xe6, 0x5a, 0x42, 0xc2, 0xb6, 0x19, 0x48, 0x66, 0x33, 0x60, 0xb9, 0x01, 0xcd, 0x12, 0x04,
	0xc3, 0x24, 0x5a, 0x96, 0x45, 0x1b, 0x60, 0x0a, 0xf4, 0x5a, 0x18, 0x23, 0x50, 0x32, 0x8b, 0x2c,
	0x8a, 0x63, 0x30, 0xa6, 0xb4, 0x1a, 0x0c, 0xe6, 0x3a, 0x06, 0x3e, 0xbb, 0x2b, 0x1a, 0x47, 0x74,
	0x44, 0xfa, 0x87, 0x8d, 0xbf, 0xea, 0xaf, 0x15, 0xde, 0x85, 0xb1, 0x9c, 0x36, 0x88, 0xfb, 0xe9,
	0xd4, 0x9a, 0x8b, 0x4b, 0x72, 0x41, 0x4e, 0xc6, 0x65, 0xed, 0x1c, 0xdf, 0x40, 0xd2, 0xb3, 0x96,
	0xe3, 0x75, 0x5e, 0xfc, 0xdd, 0x0c, 0x7e, 0x75, 0xc5, 0x9c, 0xe5, 0x29, 0x69, 0xff, 0x87, 0x47,
	0xcb, 0x46, 0xb9, 0xe8, 0xf0, 0x27, 0x00, 0x00, 0xff, 0xff, 0x38, 0xb8, 0x34, 0x46, 0xb9, 0x01,
	0x00, 0x00,
}
