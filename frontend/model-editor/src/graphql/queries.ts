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