import React, { useEffect } from 'react';
import { useComponentRegistry } from '../hooks/useComponentRegistry';
import { ComponentPlugin } from '../components/LayoutEditor/ComponentRegistry';

/**
 * Example of how to register a custom component plugin at runtime
 * This demonstrates the extensibility of the component system
 */
export const CustomPluginExample: React.FC = () => {
  const { register } = useComponentRegistry();

  useEffect(() => {
    // Example custom component plugin
    const customChartPlugin: ComponentPlugin = {
      id: 'custom-chart',
      type: 'CustomChart' as any, // Would need to extend ComponentType enum
      label: 'Custom Chart',
      description: 'A customizable chart component for data visualization',
      icon: 'chart',
      category: 'custom',
      configurationSchema: {
        version: '1.0',
        sections: [
          {
            id: 'basic',
            label: 'Basic',
            icon: 'settings',
            fields: [
              {
                id: 'title',
                label: 'Chart Title',
                type: 'text',
                required: true,
                description: 'The title to display above the chart'
              },
              {
                id: 'chartType',
                label: 'Chart Type',
                type: 'select',
                required: true,
                options: [
                  { value: 'bar', label: 'Bar Chart' },
                  { value: 'line', label: 'Line Chart' },
                  { value: 'pie', label: 'Pie Chart' },
                  { value: 'area', label: 'Area Chart' }
                ],
                defaultValue: 'bar'
              }
            ]
          },
          {
            id: 'data',
            label: 'Data',
            icon: 'table',
            fields: [
              {
                id: 'entityId',
                label: 'Data Source',
                type: 'entity',
                required: true,
                description: 'Select the entity to use as data source'
              },
              {
                id: 'xAxisField',
                label: 'X-Axis Field',
                type: 'field',
                required: true,
                description: 'Field to use for X-axis'
              },
              {
                id: 'yAxisField',
                label: 'Y-Axis Field',
                type: 'field',
                required: true,
                description: 'Field to use for Y-axis'
              }
            ]
          },
          {
            id: 'styling',
            label: 'Styling',
            icon: 'color',
            fields: [
              {
                id: 'primaryColor',
                label: 'Primary Color',
                type: 'color',
                defaultValue: '#3b82f6'
              },
              {
                id: 'showLegend',
                label: 'Show Legend',
                type: 'boolean',
                defaultValue: true
              },
              {
                id: 'height',
                label: 'Chart Height',
                type: 'range',
                defaultValue: 400,
                validation: {
                  min: 200,
                  max: 800
                }
              }
            ]
          }
        ]
      },
      defaultConfiguration: {
        customChart: {
          title: 'New Chart',
          chartType: 'bar',
          entityId: '',
          xAxisField: '',
          yAxisField: '',
          styling: {
            primaryColor: '#3b82f6',
            showLegend: true,
            height: 400
          }
        }
      },
      validateConfiguration: (config) => {
        const errors = [];
        
        if (!config.customChart?.title) {
          errors.push({
            field: 'title',
            message: 'Chart title is required',
            severity: 'error' as const
          });
        }
        
        if (!config.customChart?.entityId) {
          errors.push({
            field: 'entityId',
            message: 'Data source must be selected',
            severity: 'error' as const
          });
        }
        
        if (!config.customChart?.xAxisField) {
          errors.push({
            field: 'xAxisField',
            message: 'X-axis field must be selected',
            severity: 'warning' as const
          });
        }
        
        return errors;
      },
      componentFactory: (props) => {
        // This would render the actual chart component in TorqueApp
        return React.createElement('div', {
          style: {
            border: '2px dashed #ccc',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f9f9f9'
          }
        }, `Custom Chart: ${props.config?.title || 'Untitled'}`);
      },
      previewComponent: (props) => {
        // This renders a preview in the layout editor
        return React.createElement('div', {
          style: {
            border: '1px solid #ddd',
            padding: '10px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            minHeight: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }, `📊 ${props.config?.title || 'Chart Preview'}`);
      }
    };

    // Register the custom plugin
    try {
      register(customChartPlugin);
      console.log('Custom chart plugin registered successfully');
    } catch (error) {
      console.error('Failed to register custom plugin:', error);
    }

    // Cleanup function to unregister when component unmounts
    return () => {
      // Note: In a real implementation, you might want to unregister
      // but for this example, we'll leave it registered
    };
  }, [register]);

  return (
    <div>
      <h3>Custom Plugin Example</h3>
      <p>
        This component demonstrates how to register a custom component plugin at runtime.
        The custom chart plugin has been registered and should appear in the component palette.
      </p>
      <p>
        <strong>Features demonstrated:</strong>
      </p>
      <ul>
        <li>Complex configuration schema with multiple sections</li>
        <li>Different field types (text, select, entity, field, color, boolean, range)</li>
        <li>Validation rules and error handling</li>
        <li>Custom component factory for TorqueApp rendering</li>
        <li>Preview component for layout editor</li>
      </ul>
    </div>
  );
};