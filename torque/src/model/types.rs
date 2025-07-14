use crate::common::{Uuid, UtcDateTime};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Core model definition representing a complete application model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorqueModel {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub version: String,
    pub created_at: UtcDateTime,
    pub updated_at: UtcDateTime,
    pub created_by: String,
    
    // Model configuration
    pub config: ModelConfig,
    
    // Model components
    pub entities: Vec<ModelEntity>,
    pub relationships: Vec<ModelRelationship>,
    pub flows: Vec<ModelFlow>,
    pub layouts: Vec<ModelLayout>,
    pub validations: Vec<ModelValidation>,
}

/// Model configuration and metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    /// Database configuration
    pub database: DatabaseConfig,
    /// Performance settings
    pub performance: PerformanceConfig,
    /// UI/UX settings
    pub ui: UiConfig,
    /// Custom settings
    pub custom: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub partitioning_strategy: PartitioningStrategy,
    pub indexing_strategy: IndexingStrategy,
    pub retention_policy: Option<RetentionPolicy>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PartitioningStrategy {
    None,
    Hash { partitions: u32 },
    Range { field: String },
    Time { field: String, interval: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexingStrategy {
    pub auto_index: bool,
    pub custom_indexes: Vec<IndexDefinition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexDefinition {
    pub name: String,
    pub fields: Vec<String>,
    pub index_type: IndexType,
    pub unique: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IndexType {
    BTree,
    Hash,
    Gin,
    Gist,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionPolicy {
    pub max_age_days: u32,
    pub max_records: Option<u64>,
    pub cleanup_strategy: CleanupStrategy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CleanupStrategy {
    Archive,
    Delete,
    Compress,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    pub cache_strategy: CacheStrategy,
    pub query_optimization: QueryOptimization,
    pub connection_pooling: ConnectionPooling,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CacheStrategy {
    None,
    LRU { max_size: usize, ttl_seconds: u64 },
    WriteThrough,
    WriteBack,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryOptimization {
    pub enable_query_cache: bool,
    pub enable_prepared_statements: bool,
    pub batch_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionPooling {
    pub min_connections: u32,
    pub max_connections: u32,
    pub timeout_seconds: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiConfig {
    pub theme: String,
    pub layout: LayoutConfig,
    pub components: ComponentConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutConfig {
    pub default_layout: String,
    pub responsive_breakpoints: Vec<ResponsiveBreakpoint>,
    pub grid_system: GridSystem,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResponsiveBreakpoint {
    pub name: String,
    pub min_width: u32,
    pub columns: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GridSystem {
    pub columns: u32,
    pub gutter: u32,
    pub margin: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentConfig {
    pub default_components: HashMap<String, serde_json::Value>,
    pub custom_components: Vec<CustomComponent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomComponent {
    pub name: String,
    pub component_type: String,
    pub props: HashMap<String, serde_json::Value>,
    pub style: HashMap<String, serde_json::Value>,
}

/// Entity definition within a model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelEntity {
    pub id: Uuid,
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub entity_type: EntityType,
    
    // Entity structure
    pub fields: Vec<EntityField>,
    pub constraints: Vec<EntityConstraint>,
    pub indexes: Vec<EntityIndex>,
    
    // UI configuration
    pub ui_config: EntityUiConfig,
    
    // Behavior configuration
    pub behavior: EntityBehavior,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EntityType {
    Data,        // Regular data entity
    Lookup,      // Reference/lookup table
    Audit,       // Audit/log entity
    Temporary,   // Temporary/session entity
    View,        // Database view
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityField {
    pub id: Uuid,
    pub name: String,
    pub display_name: String,
    pub field_type: FieldType,
    pub required: bool,
    pub default_value: Option<serde_json::Value>,
    pub validation: Vec<FieldValidation>,
    pub ui_config: FieldUiConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FieldType {
    String { max_length: Option<usize> },
    Integer { min: Option<i64>, max: Option<i64> },
    Float { min: Option<f64>, max: Option<f64> },
    Boolean,
    DateTime,
    Date,
    Time,
    Json,
    Binary,
    Enum { values: Vec<String> },
    Reference { entity_id: Uuid },
    Array { element_type: Box<FieldType> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldValidation {
    pub validation_type: ValidationType,
    pub message: String,
    pub severity: ValidationSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationType {
    Required,
    MinLength(usize),
    MaxLength(usize),
    Pattern(String),
    Range { min: serde_json::Value, max: serde_json::Value },
    Custom(String), // Custom validation expression
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldUiConfig {
    pub component_type: String,
    pub label: Option<String>,
    pub placeholder: Option<String>,
    pub help_text: Option<String>,
    pub visibility: FieldVisibility,
    pub edit_mode: FieldEditMode,
    pub custom_props: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FieldVisibility {
    Visible,
    Hidden,
    Conditional(String), // Condition expression
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FieldEditMode {
    Editable,
    ReadOnly,
    Disabled,
    Conditional(String), // Condition expression
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityConstraint {
    pub constraint_type: ConstraintType,
    pub name: String,
    pub fields: Vec<String>,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConstraintType {
    PrimaryKey,
    UniqueKey,
    ForeignKey { reference_entity: Uuid, reference_field: String },
    Check(String), // Check expression
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityIndex {
    pub name: String,
    pub fields: Vec<String>,
    pub index_type: IndexType,
    pub unique: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityUiConfig {
    pub icon: Option<String>,
    pub color: Option<String>,
    pub list_view: ListView,
    pub detail_view: DetailView,
    pub form_view: FormView,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListView {
    pub columns: Vec<ListColumn>,
    pub default_sort: Option<String>,
    pub pagination: PaginationConfig,
    pub filters: Vec<FilterConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListColumn {
    pub field: String,
    pub width: Option<String>,
    pub sortable: bool,
    pub filterable: bool,
    pub formatter: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginationConfig {
    pub page_size: usize,
    pub show_page_size_options: bool,
    pub page_size_options: Vec<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterConfig {
    pub field: String,
    pub filter_type: FilterType,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FilterType {
    Text,
    Select { options: Vec<String> },
    DateRange,
    NumberRange,
    Boolean,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailView {
    pub layout: DetailLayout,
    pub sections: Vec<DetailSection>,
    pub actions: Vec<ActionConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DetailLayout {
    Tabs,
    Accordion,
    Single,
    TwoColumn,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailSection {
    pub name: String,
    pub title: String,
    pub fields: Vec<String>,
    pub collapsible: bool,
    pub default_collapsed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormView {
    pub layout: FormLayout,
    pub validation: FormValidation,
    pub submission: FormSubmission,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FormLayout {
    Single,
    TwoColumn,
    Wizard,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormValidation {
    pub client_side: bool,
    pub server_side: bool,
    pub real_time: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormSubmission {
    pub auto_save: bool,
    pub confirmation: bool,
    pub redirect_after_save: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionConfig {
    pub name: String,
    pub label: String,
    pub action_type: ActionType,
    pub icon: Option<String>,
    pub confirmation: Option<String>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionType {
    Create,
    Edit,
    Delete,
    Custom(String), // Custom action handler
    Navigate(String), // Navigation target
    Export(String), // Export format
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityBehavior {
    pub auditing: AuditConfig,
    pub caching: CacheConfig,
    pub lifecycle: LifecycleConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditConfig {
    pub enabled: bool,
    pub track_changes: bool,
    pub track_access: bool,
    pub retention_days: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheConfig {
    pub enabled: bool,
    pub ttl_seconds: u64,
    pub invalidation_strategy: CacheInvalidationStrategy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CacheInvalidationStrategy {
    TimeToLive,
    OnUpdate,
    Manual,
    Dependency(Vec<String>), // Dependent entities
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LifecycleConfig {
    pub hooks: Vec<LifecycleHook>,
    pub workflows: Vec<String>, // Reference to XFlow workflows
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LifecycleHook {
    pub event: LifecycleEvent,
    pub handler: String, // Handler function or workflow reference
    pub async_execution: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LifecycleEvent {
    BeforeCreate,
    AfterCreate,
    BeforeUpdate,
    AfterUpdate,
    BeforeDelete,
    AfterDelete,
    OnRead,
}

/// Relationship between entities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRelationship {
    pub id: Uuid,
    pub name: String,
    pub relationship_type: RelationshipType,
    pub from_entity: Uuid,
    pub to_entity: Uuid,
    pub from_field: String,
    pub to_field: String,
    pub cascade: CascadeAction,
    pub ui_config: RelationshipUiConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RelationshipType {
    OneToOne,
    OneToMany,
    ManyToOne,
    ManyToMany,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CascadeAction {
    None,
    Delete,
    SetNull,
    Restrict,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RelationshipUiConfig {
    pub display_in_form: bool,
    pub display_in_list: bool,
    pub component_type: String,
    pub custom_props: HashMap<String, serde_json::Value>,
}

/// Flow definition for business logic
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelFlow {
    pub id: Uuid,
    pub name: String,
    pub flow_type: FlowType,
    pub trigger: FlowTrigger,
    pub steps: Vec<FlowStep>,
    pub error_handling: ErrorHandling,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FlowType {
    Validation,
    Automation,
    Approval,
    Notification,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum FlowTrigger {
    EntityEvent { entity_id: Uuid, event: LifecycleEvent },
    Schedule(String), // Cron expression
    #[default]
    Manual,
    Webhook,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowStep {
    pub id: Uuid,
    pub name: String,
    pub step_type: FlowStepType,
    pub condition: Option<String>,
    pub configuration: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FlowStepType {
    Validation,
    Transformation,
    Notification,
    Integration,
    Approval,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ErrorHandling {
    pub retry_attempts: u32,
    pub retry_delay_seconds: u32,
    pub on_error: ErrorAction,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ErrorAction {
    #[default]
    Stop,
    Continue,
    Rollback,
    Notify,
}

/// Layout definition for UI presentation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelLayout {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub layout_type: LayoutType,
    pub target_entities: Vec<Uuid>,
    pub components: Vec<LayoutComponent>,
    pub responsive: ResponsiveLayout,
    pub created_at: UtcDateTime,
    pub updated_at: UtcDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LayoutType {
    List,
    Grid,
    Dashboard,
    Form,
    Detail,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutComponent {
    pub id: Uuid,
    pub component_type: String,
    pub position: ComponentPosition,
    pub properties: HashMap<String, serde_json::Value>,
    pub styling: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ComponentPosition {
    pub row: u32,
    pub column: u32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ResponsiveLayout {
    pub breakpoints: Vec<ResponsiveBreakpoint>,
    pub adaptive_components: Vec<AdaptiveComponent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdaptiveComponent {
    pub component_id: Uuid,
    pub breakpoint_configs: HashMap<String, ComponentPosition>,
}

/// Model validation rules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelValidation {
    pub id: Uuid,
    pub name: String,
    pub validation_type: ModelValidationType,
    pub scope: ValidationScope,
    pub rule: String,
    pub message: String,
    pub severity: ValidationSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ModelValidationType {
    EntityValidation,
    RelationshipValidation,
    BusinessRule,
    DataIntegrity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationScope {
    Field(Uuid),
    Entity(Uuid),
    Relationship(Uuid),
    Model,
}

// Default implementations for common model configurations
impl Default for ModelConfig {
    fn default() -> Self {
        Self {
            database: DatabaseConfig::default(),
            performance: PerformanceConfig::default(),
            ui: UiConfig::default(),
            custom: HashMap::new(),
        }
    }
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            partitioning_strategy: PartitioningStrategy::None,
            indexing_strategy: IndexingStrategy::default(),
            retention_policy: None,
        }
    }
}

impl Default for IndexingStrategy {
    fn default() -> Self {
        Self {
            auto_index: true,
            custom_indexes: Vec::new(),
        }
    }
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self {
            cache_strategy: CacheStrategy::LRU { max_size: 1000, ttl_seconds: 3600 },
            query_optimization: QueryOptimization::default(),
            connection_pooling: ConnectionPooling::default(),
        }
    }
}

impl Default for QueryOptimization {
    fn default() -> Self {
        Self {
            enable_query_cache: true,
            enable_prepared_statements: true,
            batch_size: 100,
        }
    }
}

impl Default for ConnectionPooling {
    fn default() -> Self {
        Self {
            min_connections: 5,
            max_connections: 50,
            timeout_seconds: 30,
        }
    }
}

impl Default for UiConfig {
    fn default() -> Self {
        Self {
            theme: "default".to_string(),
            layout: LayoutConfig::default(),
            components: ComponentConfig::default(),
        }
    }
}

impl Default for LayoutConfig {
    fn default() -> Self {
        Self {
            default_layout: "responsive".to_string(),
            responsive_breakpoints: vec![
                ResponsiveBreakpoint { name: "mobile".to_string(), min_width: 0, columns: 1 },
                ResponsiveBreakpoint { name: "tablet".to_string(), min_width: 768, columns: 2 },
                ResponsiveBreakpoint { name: "desktop".to_string(), min_width: 1024, columns: 3 },
            ],
            grid_system: GridSystem { columns: 12, gutter: 16, margin: 16 },
        }
    }
}

impl Default for ComponentConfig {
    fn default() -> Self {
        Self {
            default_components: HashMap::new(),
            custom_components: Vec::new(),
        }
    }
}