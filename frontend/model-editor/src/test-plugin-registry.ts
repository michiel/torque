/**
 * Test script to verify component plugin registry functionality
 */
import { componentRegistry } from './components/LayoutEditor/ComponentRegistry';

// Test the component registry
console.log('Testing Component Plugin Registry...');

// Get all built-in components
const allPlugins = componentRegistry.getAll();
console.log(`Found ${allPlugins.length} built-in components:`);
allPlugins.forEach(plugin => {
  console.log(`- ${plugin.label} (${plugin.type}) - ${plugin.category}`);
});

// Test search functionality
const dataComponents = componentRegistry.getByCategory('data');
console.log(`\nData components: ${dataComponents.length}`);
dataComponents.forEach(plugin => {
  console.log(`- ${plugin.label}`);
});

// Test search by keyword
const searchResults = componentRegistry.search('form');
console.log(`\nSearch results for 'form': ${searchResults.length}`);
searchResults.forEach(plugin => {
  console.log(`- ${plugin.label}`);
});

// Test getting specific plugin
const dataGridPlugin = componentRegistry.getById('datagrid');
if (dataGridPlugin) {
  console.log(`\nDataGrid plugin found:`);
  console.log(`- Label: ${dataGridPlugin.label}`);
  console.log(`- Configuration sections: ${dataGridPlugin.configurationSchema.sections.length}`);
  console.log(`- Default config keys: ${Object.keys(dataGridPlugin.defaultConfiguration)}`);
}

// Test validation
const testConfig = {
  dataGrid: {
    entityId: '',
    columns: []
  }
};

const validationErrors = componentRegistry.validateConfiguration('datagrid', testConfig);
console.log(`\nValidation test (empty config): ${validationErrors.length} errors`);
validationErrors.forEach(error => {
  console.log(`- ${error.field}: ${error.message} (${error.severity})`);
});

console.log('\nComponent Plugin Registry test completed successfully!');