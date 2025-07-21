/**
 * Layout validation utilities for frontend validation before saving
 */

import { Data } from '@measured/puck';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate layout data before saving
 */
export function validateLayoutData(data: Data, modelId?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if data is present
  if (!data) {
    errors.push('Layout data is required');
    return { isValid: false, errors, warnings };
  }

  // Check model ID
  if (!modelId) {
    errors.push('Model ID is required');
  }

  // Check layout name
  const layoutName = data.root?.props?.title;
  if (!layoutName || layoutName.trim().length === 0) {
    warnings.push('Layout name is empty, will default to "New Layout"');
  } else if (layoutName.length > 100) {
    errors.push('Layout name cannot exceed 100 characters');
  }

  // Check components
  if (!data.content || !Array.isArray(data.content)) {
    warnings.push('Layout has no components');
  } else {
    // Validate each component
    data.content.forEach((component, index) => {
      if (!component.type) {
        errors.push(`Component ${index + 1} is missing a type`);
      }

      if (!component.props) {
        warnings.push(`Component ${index + 1} has no properties defined`);
      }

      // Validate component-specific properties
      if (component.type === 'DataGrid') {
        if (!component.props?.entityType) {
          warnings.push(`DataGrid component ${index + 1} has no entity type specified`);
        }
      } else if (component.type === 'TorqueForm') {
        if (!component.props?.entityType) {
          warnings.push(`TorqueForm component ${index + 1} has no entity type specified`);
        }
        if (!component.props?.fields || component.props.fields.length === 0) {
          warnings.push(`TorqueForm component ${index + 1} has no fields defined`);
        }
      } else if (component.type === 'Text') {
        if (!component.props?.content && !component.props?.text) {
          warnings.push(`Text component ${index + 1} has no content`);
        }
      }
    });
  }

  // Check for circular references or invalid JSON
  try {
    JSON.stringify(data);
  } catch (error) {
    errors.push('Layout data contains circular references or invalid JSON');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate component position data
 */
export function validatePosition(position: any): boolean {
  if (!position || typeof position !== 'object') {
    return false;
  }

  const requiredFields = ['row', 'column', 'width', 'height'];
  for (const field of requiredFields) {
    if (!(field in position) || typeof position[field] !== 'number' || position[field] < 0) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitize layout data to remove potentially problematic fields
 */
export function sanitizeLayoutData(data: Data): Data {
  try {
    // Deep clone to avoid mutating original data
    const sanitized = JSON.parse(JSON.stringify(data));

    // Remove any undefined or null values
    const cleanContent = sanitized.content?.filter((component: any) => component != null) || [];

    // Clean component props
    const cleanedComponents = cleanContent.map((component: any) => {
      const cleanProps = { ...component.props };
      
      // Remove internal Puck properties
      delete cleanProps.id;
      delete cleanProps.editableProps;
      delete cleanProps.droppableProps;
      delete cleanProps._puckData;
      delete cleanProps._visualEditor;

      return {
        ...component,
        props: cleanProps
      };
    });

    return {
      ...sanitized,
      content: cleanedComponents,
      root: {
        ...sanitized.root,
        props: {
          ...sanitized.root?.props,
          title: sanitized.root?.props?.title || 'New Layout'
        }
      }
    };
  } catch (error) {
    console.error('Error sanitizing layout data:', error);
    return data; // Return original data if sanitization fails
  }
}