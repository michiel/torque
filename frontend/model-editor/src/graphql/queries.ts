import { gql } from '@apollo/client'

// Query to get a specific layout
export const GET_LAYOUT = gql`
  query GetLayout($id: String!) {
    layout(id: $id) {
      id
      name
      description
      layoutType
      targetEntities
      components {
        id
        componentType
        position
        properties
        styling
        metadata
      }
      responsive
      createdAt
      updatedAt
    }
  }
`

// Query to get all models
export const GET_MODELS = gql`
  query GetModels {
    models {
      id
      name
      description
      version
      createdAt
      updatedAt
      createdBy
      config
      entities {
        id
        name
        displayName
        description
        entityType
      }
      relationships {
        id
        name
        relationshipType
        fromEntity
        toEntity
        fromField
        toField
        cascade
      }
      flows {
        id
        name
        flowType
      }
      layouts {
        id
        name
        layoutType
        targetEntities
      }
      validations {
        id
        name
        validationType
        scope
        rule
        message
        severity
      }
    }
  }
`

// Query to get a specific model by ID
export const GET_MODEL = gql`
  query GetModel($id: String!) {
    model(id: $id) {
      id
      name
      description
      version
      createdAt
      updatedAt
      createdBy
      config
      entities {
        id
        name
        displayName
        description
        entityType
        fields {
          id
          name
          displayName
          fieldType
          required
          defaultValue
          validation
          uiConfig
        }
        uiConfig
        behavior
      }
      relationships {
        id
        name
        relationshipType
        fromEntity
        toEntity
        fromField
        toField
        cascade
        uiConfig
      }
      flows {
        id
        name
        flowType
        trigger
        steps {
          id
          name
          stepType
          condition
          configuration
        }
        errorHandling
      }
      layouts {
        id
        name
        layoutType
        targetEntities
        components {
          id
          componentType
          position
          properties
          styling
          metadata
        }
        responsive
      }
      validations {
        id
        name
        validationType
        scope
        rule
        message
        severity
      }
    }
  }
`

// Query to get entities for a specific model
export const GET_ENTITIES = gql`
  query GetEntities($modelId: String!) {
    entities(modelId: $modelId) {
      id
      name
      displayName
      description
      entityType
      fields {
        id
        name
        displayName
        fieldType
        required
        defaultValue
        validation
        uiConfig
      }
      uiConfig
      behavior
    }
  }
`

// Query to get relationships for a specific model
export const GET_RELATIONSHIPS = gql`
  query GetRelationships($modelId: String!) {
    relationships(modelId: $modelId) {
      id
      name
      relationshipType
      fromEntity
      toEntity
      fromField
      toField
      cascade
      uiConfig
    }
  }
`

// Query to search models
export const SEARCH_MODELS = gql`
  query SearchModels($query: String!) {
    searchModels(query: $query) {
      id
      name
      description
      version
      createdAt
      updatedAt
      createdBy
    }
  }
`

// Query to verify a model for configuration mismatches
export const VERIFY_MODEL = gql`
  query VerifyModel($modelId: String!) {
    verifyModel(modelId: $modelId) {
      modelId
      modelName
      generatedAt
      totalErrors
      errorsBySeverity {
        critical
        high
        medium
        low
      }
      errors {
        id
        error
        severity
        category
        title
        description
        impact
        location {
          componentType
          componentId
          componentName
          path
          fileReference
        }
        suggestedFixes
        autoFixable
      }
      suggestions {
        title
        description
        actionType
        affectedErrors
        estimatedEffort
      }
    }
  }
`

// Query to get remediation strategies for a specific error type
export const GET_REMEDIATION_STRATEGIES = gql`
  query GetRemediationStrategies($input: GetRemediationStrategiesInput!) {
    getRemediationStrategies(input: $input) {
      id
      errorType
      strategyType
      title
      description
      parameters {
        name
        description
        parameterType
        required
        defaultValue
        validation
      }
      estimatedEffort
      riskLevel
      prerequisites
    }
  }
`

// Mutation to execute auto-remediation
export const EXECUTE_AUTO_REMEDIATION = gql`
  mutation ExecuteAutoRemediation($input: ExecuteRemediationInput!) {
    executeAutoRemediation(input: $input) {
      success
      changesApplied {
        changeType
        componentType
        componentId
        description
        details
      }
      errors
      warnings
    }
  }
`