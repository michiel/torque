# Torque Sample Applications

This directory contains sample applications and models for the Torque platform.

## Customer-Order Management System

### Overview
A comprehensive customer relationship management system with order processing, featuring:
- Customer management with different customer types
- Order processing with status tracking
- Payment processing with multiple methods
- Comprehensive form and list views
- Business logic workflows
- Real-time notifications

### Features

#### Customer Management
- Customer types: Individual, Business, Premium, Enterprise
- Full contact information management
- Registration tracking and status management
- Professional list views with filtering and sorting
- Responsive form design with validation

#### Order Processing
- Complete order lifecycle management
- Status workflow: Draft → Pending → Confirmed → Processing → Shipped → Delivered
- Payment methods: Credit Card, Debit Card, PayPal, Bank Transfer, Cash on Delivery
- Payment status tracking: Pending, Processing, Completed, Failed, Refunded
- Order notes and special instructions
- Comprehensive audit trail

#### User Interface
- Professional Mantine UI components
- Responsive design for mobile and desktop
- Tab-based detail views
- Advanced filtering and search capabilities
- Real-time updates and notifications

#### Business Logic
- Order status validation workflows
- Email notifications for order confirmations
- Automatic audit trail generation
- Caching for performance optimization

### Data Model

#### Customer Entity
- **Fields**: ID, First Name, Last Name, Email, Phone, Address, Customer Type, Registration Date, Active Status
- **Validation**: Email format validation, required fields, unique constraints
- **UI**: Professional form with two-column layout, advanced list view with filtering

#### Order Entity
- **Fields**: ID, Customer Reference, Order Date, Status, Total Amount, Shipping Address, Payment Method, Payment Status, Notes
- **Validation**: Positive amount validation, required fields, foreign key constraints
- **UI**: Tabbed detail view, comprehensive filtering, status-based styling

#### Relationships
- One-to-Many: Customer to Orders
- Referential integrity with cascade options
- UI integration with related data display

### Sample Data
- 5 sample customers representing different customer types
- 6 sample orders demonstrating various order states
- Realistic data for testing and demonstration

### Usage

#### CLI Commands
```bash
# Create a new model
torque model create "Customer Management" --description "CRM system"

# List all models
torque model list

# Export a model
torque model export --model-id <ID> --output customer-order.json

# Import the sample model
torque model import --input sample/models/customer-order.json

# Delete a model
torque model delete <ID>
```

#### JSON Schema Validation
The model follows the comprehensive JSON schema defined in `sample/schemas/torque-model.schema.json`, ensuring:
- Type safety for all field definitions
- Validation rule compliance
- UI configuration consistency
- Business logic validation

### Architecture

#### Model Structure
- **Entities**: Define data structure and validation rules
- **Relationships**: Define data connections and integrity
- **Flows**: Define business logic and workflows
- **Layouts**: Define UI presentation and interaction

#### Technical Features
- **Type Safety**: Full TypeScript integration
- **Performance**: Optimized caching and indexing
- **Scalability**: Designed for high-volume usage
- **Security**: Comprehensive validation and sanitization

### Development Notes

#### Requirements
- Rust 1.70+ with Cargo
- SQLite or PostgreSQL database
- Node.js 18+ for frontend development

#### Configuration
The sample uses SQLite for simplicity, but can be configured for PostgreSQL for production use.

#### Extension Points
- Add custom validation rules
- Implement additional business workflows
- Extend UI components with custom styling
- Add integration with external systems

### Testing
The sample includes comprehensive test data and can be used to verify:
- End-to-end model creation and management
- Form validation and submission
- List view filtering and sorting
- Business logic execution
- Real-time synchronization

This sample application demonstrates the full capabilities of the Torque platform and serves as a template for building custom applications.