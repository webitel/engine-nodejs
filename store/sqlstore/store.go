package sqlstore

import (
	_ "github.com/lib/pq"
	"github.com/webitel/engine/store"

	"github.com/go-gorp/gorp"
)

type SqlStore interface {
	GetMaster() *gorp.DbMap
	GetReplica() *gorp.DbMap
	GetAllConns() []*gorp.DbMap

	User() store.UserStore
	Calendar() store.CalendarStore
	Skill() store.SkillStore
	AgentTeam() store.AgentTeamStore
	Agent() store.AgentStore
	AgentSkill() store.AgentSkillStore
	ResourceTeam() store.ResourceTeamStore
	OutboundResource() store.OutboundResourceStore
	OutboundResourceGroup() store.OutboundResourceGroupStore
	OutboundResourceInGroup() store.OutboundResourceInGroupStore
	Queue() store.QueueStore
	Bucket() store.BucketSore
	BucketInQueue() store.BucketInQueueStore
	QueueRouting() store.QueueRoutingStore
	SupervisorTeam() store.SupervisorTeamStore
	CommunicationType() store.CommunicationTypeStore
	List() store.ListStore

	Member() store.MemberStore

	RoutingScheme() store.RoutingSchemeStore
	RoutingInboundCall() store.RoutingInboundCallStore
	RoutingOutboundCall() store.RoutingOutboundCallStore
	RoutingVariable() store.RoutingVariableStore
}
