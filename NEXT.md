
## Auto-remediate errors

- In rust code,
  - For a given model configuration mismatch error, have a set of standard options to remediate the error (parameterised) (if possible)
  - You can pass an error with parameters to a remediation option for auto-remediation
  - Expose this auto-remediation functionality via graphql mutation
- In the model-editor,
  - On the verification errors page, when showing error detail also show error remediation options and make them clickable if they are auto-remediatable, which triggers the selected auto-remediation via graphql mutation
- Add an MCP tool for verification and one for auto-remediation using the same backend

## Updates

- Make the Model verification details clickable for the components it has identified errors in. Example "DataGrid component '1eacc461-5364-44a8-a61f-089d66d57f7f' references non-existent fields in entity 'project'"

## Add settings

- Enable / disable MCP interface dynamically

