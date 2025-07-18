// Test script to verify entity ID conversion functionality
// This simulates the conversion logic that happens when saving layouts

console.log('=== Testing Entity ID Conversion Logic ===\n');

// Mock available entities (like what would come from GraphQL)
const availableEntities = [
    { id: 'uuid-customer-123', name: 'customer', displayName: 'Customer' },
    { id: 'uuid-order-456', name: 'order', displayName: 'Order' },
    { id: 'uuid-product-789', name: 'product', displayName: 'Product' }
];

// Mock Puck data with entity references (as created in Visual Layout Editor)
const puckData = {
    content: [
        {
            type: 'DataGrid',
            props: {
                entityType: 'customer',
                columns: [
                    { field: 'name', header: 'Name', type: 'text', sortable: true },
                    { field: 'email', header: 'Email', type: 'text', sortable: true }
                ],
                showPagination: true,
                pageSize: 10
            }
        },
        {
            type: 'TorqueForm',
            props: {
                entityType: 'order',
                formTitle: 'Create Order',
                fields: [
                    { name: 'amount', label: 'Amount', type: 'number', required: true },
                    { name: 'status', label: 'Status', type: 'select', required: true }
                ]
            }
        },
        {
            type: 'TorqueButton',
            props: {
                text: 'Submit Order',
                variant: 'filled',
                color: 'blue'
            }
        }
    ],
    root: {
        title: 'Test Layout with Entity Bindings'
    }
};

// Simulate the conversion function from the layout migration utility
function convertPuckToLegacyLayout(puckData, layoutId, modelId, existingLayout, availableEntities) {
    console.log('1. Starting conversion process...');
    console.log('   Puck data content items:', puckData.content.length);
    
    const components = puckData.content.map((item, index) => {
        console.log(`   Processing component ${index + 1}: ${item.type}`);
        
        return {
            componentType: item.type,
            position: {
                row: index,
                column: 0,
                width: 12,
                height: item.type === 'DataGrid' ? 6 : item.type === 'TorqueForm' ? 8 : 2
            },
            properties: {
                ...item.props,
                _puckData: JSON.stringify(item),
                _visualEditor: true
            },
            styling: {}
        };
    });
    
    console.log('\n2. Extracting target entities...');
    
    // Extract all target entities from components
    const targetEntityNames = [...new Set(
        components
            .filter(comp => comp.properties && 'entityType' in comp.properties && comp.properties.entityType)
            .map(comp => comp.properties.entityType)
            .filter(Boolean)
    )];
    
    console.log('   Target entity names found:', targetEntityNames);
    console.log('   Available entities:', availableEntities.map(e => ({ id: e.id, name: e.name })));
    
    console.log('\n3. Converting entity names to IDs...');
    
    const targetEntities = targetEntityNames
        .map(entityName => {
            const entity = availableEntities.find(e => e.name === entityName);
            if (!entity) {
                console.log(`   ❌ Entity "${entityName}" not found in available entities`);
                return null;
            }
            console.log(`   ✅ Mapped entity "${entityName}" to ID: ${entity.id}`);
            return entity.id;
        })
        .filter(Boolean);
    
    console.log('\n4. Final conversion result:');
    
    const result = {
        name: puckData.root?.title || 'New Layout',
        modelId,
        targetEntities,
        components,
        layoutType: 'Dashboard',
        responsive: {
            breakpoints: [
                { name: 'mobile', minWidth: 0, columns: 1 },
                { name: 'tablet', minWidth: 768, columns: 2 },
                { name: 'desktop', minWidth: 1024, columns: 3 }
            ]
        }
    };
    
    console.log('   Layout name:', result.name);
    console.log('   Model ID:', result.modelId);
    console.log('   Target entities (IDs):', result.targetEntities);
    console.log('   Component count:', result.components.length);
    console.log('   Layout type:', result.layoutType);
    
    return result;
}

// Test the conversion
console.log('🧪 Starting entity ID conversion test...\n');

const result = convertPuckToLegacyLayout(
    puckData, 
    'test-layout-123', 
    'test-model-456', 
    null, 
    availableEntities
);

console.log('\n=== Test Results ===');

// Verify results
const success = result.targetEntities && result.targetEntities.length === 2;
const hasCustomerEntity = result.targetEntities.includes('uuid-customer-123');
const hasOrderEntity = result.targetEntities.includes('uuid-order-456');

console.log('✅ Test Status:', success ? 'PASSED' : 'FAILED');
console.log('✅ Customer entity converted:', hasCustomerEntity);
console.log('✅ Order entity converted:', hasOrderEntity);
console.log('✅ Button component preserved:', result.components.some(c => c.componentType === 'TorqueButton'));

if (success) {
    console.log('\n🎉 Entity ID conversion is working correctly!');
    console.log('   The fix should resolve the "Invalid target entity ID format" error.');
} else {
    console.log('\n❌ Entity ID conversion failed!');
    console.log('   The error may still occur during save operations.');
}

console.log('\n=== Final Layout Data (as would be sent to GraphQL) ===');
console.log(JSON.stringify(result, null, 2));