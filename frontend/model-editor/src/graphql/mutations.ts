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