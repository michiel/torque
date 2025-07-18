import { gql } from '@apollo/client'

// Mutation to create a new model
export const CREATE_MODEL = gql`
  mutation CreateModel($input: CreateModelInput!) {
    createModel(input: $input) {
      id
      name
      description
      version
      createdAt
      updatedAt
      createdBy
      config
    }
  }
`

// Mutation to update an existing model
export const UPDATE_MODEL = gql`
  mutation UpdateModel($id: String!, $input: UpdateModelInput!) {
    updateModel(id: $id, input: $input) {
      id
      name
      description
      version
      createdAt
      updatedAt
      createdBy
      config
    }
  }
`

// Mutation to update model configuration
export const UPDATE_MODEL_CONFIG = gql`
  mutation UpdateModelConfig($id: String!, $input: UpdateModelConfigInput!) {
    updateModelConfig(id: $id, input: $input) {
      id
      name
      description
      version
      createdAt
      updatedAt
      createdBy
      config
    }
  }
`

// Mutation to delete a model
export const DELETE_MODEL = gql`
  mutation DeleteModel($id: String!) {
    deleteModel(id: $id)
  }
`

// Mutation to create a new entity
export const CREATE_ENTITY = gql`
  mutation CreateEntity($input: CreateEntityInput!) {
    createEntity(input: $input) {
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

// Mutation to update an entity
export const UPDATE_ENTITY = gql`
  mutation UpdateEntity($id: String!, $input: UpdateEntityInput!) {
    updateEntity(id: $id, input: $input) {
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

// Mutation to delete an entity
export const DELETE_ENTITY = gql`
  mutation DeleteEntity($id: String!) {
    deleteEntity(id: $id)
  }
`

// Mutation to validate a model
export const VALIDATE_MODEL = gql`
  mutation ValidateModel($id: String!) {
    validateModel(id: $id) {
      valid
      errors {
        message
        field
        code
      }
      warnings {
        message
        field
        code
      }
    }
  }
`

// Mutation to export a model
export const EXPORT_MODEL = gql`
  mutation ExportModel($id: String!) {
    exportModel(id: $id)
  }
`

// Mutation to import a model
export const IMPORT_MODEL = gql`
  mutation ImportModel($data: String!) {
    importModel(data: $data) {
      id
      name
      description
      version
      createdAt
      updatedAt
      createdBy
      config
    }
  }
`

// Mutation to replace an existing model with imported data
export const REPLACE_MODEL = gql`
  mutation ReplaceModel($id: String!, $data: String!) {
    replaceModel(id: $id, data: $data) {
      id
      name
      description
      version
      createdAt
      updatedAt
      createdBy
      config
    }
  }
`

// Mutation to create a new layout
export const CREATE_LAYOUT = gql`
  mutation CreateLayout($input: CreateLayoutInput!) {
    createLayout(input: $input) {
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
  }
`

// Mutation to update an existing layout
export const UPDATE_LAYOUT = gql`
  mutation UpdateLayout($id: String!, $input: UpdateLayoutInput!) {
    updateLayout(id: $id, input: $input) {
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
  }
`

// Mutation to delete a layout
export const DELETE_LAYOUT = gql`
  mutation DeleteLayout($id: String!) {
    deleteLayout(id: $id)
  }
`

// Mutation to create a new relationship
export const CREATE_RELATIONSHIP = gql`
  mutation CreateRelationship($input: CreateRelationshipInput!) {
    createRelationship(input: $input) {
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

// Mutation to update a relationship
export const UPDATE_RELATIONSHIP = gql`
  mutation UpdateRelationship($id: String!, $input: UpdateRelationshipInput!) {
    updateRelationship(id: $id, input: $input) {
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

// Mutation to delete a relationship
export const DELETE_RELATIONSHIP = gql`
  mutation DeleteRelationship($id: String!) {
    deleteRelationship(id: $id)
  }
`