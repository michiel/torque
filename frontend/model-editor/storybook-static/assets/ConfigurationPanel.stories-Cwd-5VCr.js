import{j as l}from"./jsx-runtime-CDt2p4po.js";import{C as T}from"./ConfigurationPanel-LJG9ubju.js";import{M as D}from"./MantineProvider-QIY2Z6QD.js";import"./index-GiUgBvb1.js";import"./v4-CtRu48qb.js";import"./Card-Cdu5HIUj.js";import"./createReactComponent-DeW0SWsj.js";import"./Paper-C74rEzGU.js";import"./Text-DRIe2lk6.js";import"./Stack-BdVTzV5n.js";import"./IconSettings-D4Y479Cq.js";import"./IconX-DFCRbXwC.js";import"./Button-DxGj0eyG.js";import"./Transition-CgjnMQvV.js";import"./index-CROobee-.js";import"./UnstyledButton-93KfNP2S.js";import"./InputBase-qatfRSiM.js";import"./floating-ui.react-CpMue5oT.js";import"./FocusTrap-D951crCF.js";import"./use-floating-auto-update-T6hkbBTP.js";import"./Select-ONZWQqDe.js";import"./Badge-DlnNQPvo.js";import"./Tabs-DIZ0DkZF.js";import"./IconDatabase-BwcsqcPj.js";import"./TextInput-CTL6muRQ.js";const n=[{id:"customer",name:"customer",displayName:"Customer",fields:[{id:"first_name",name:"first_name",displayName:"First Name",fieldType:{type:"String"},required:!0},{id:"last_name",name:"last_name",displayName:"Last Name",fieldType:{type:"String"},required:!0},{id:"email",name:"email",displayName:"Email",fieldType:{type:"String"},required:!0}]}],d={id:"datagrid-1",type:"DataGrid",position:{row:0,column:0,rowSpan:4,colSpan:6},configuration:{dataGrid:{entityId:"customer",columns:[{id:"col-1",fieldId:"first_name",label:"First Name",type:"string",sortable:!0,filterable:!0,width:"150px",alignment:"left"},{id:"col-2",fieldId:"last_name",label:"Last Name",type:"string",sortable:!0,filterable:!0,width:"150px",alignment:"left"}],pagination:{enabled:!0,pageSize:25},filtering:{enabled:!0},sorting:{enabled:!0},actions:[]}},validation:[]},N={id:"form-1",type:"TorqueForm",position:{row:0,column:6,rowSpan:6,colSpan:4},configuration:{form:{entityId:"customer",fields:[],validation:{clientSide:!0,serverSide:!0,realTime:!0},layout:"single-column",submission:{action:"create"}}},validation:[{field:"fields",message:"At least one field is required for the form",severity:"error"}]},tn={title:"Layout Editor/Configuration Panel",component:T,parameters:{layout:"padded",docs:{description:{component:"Configuration panel for editing component properties and validation."}}},decorators:[s=>l.jsx(D,{children:l.jsx("div",{style:{width:"400px",height:"600px"},children:l.jsx(s,{})})})],argTypes:{onUpdate:{action:"configuration updated"},onValidate:{action:"validation requested"}}},e={args:{component:null,entities:n},parameters:{docs:{description:{story:"Configuration panel when no component is selected."}}}},t={args:{component:d,entities:n,onValidate:async s=>[]},parameters:{docs:{description:{story:"Configuration panel for a DataGrid component with entity binding."}}}},i={args:{component:{...d,configuration:{dataGrid:{entityId:"customer",columns:[{id:"col-1",fieldId:"first_name",label:"First Name",type:"string",sortable:!0,filterable:!0,width:"150px",alignment:"left"},{id:"col-2",fieldId:"last_name",label:"Last Name",type:"string",sortable:!0,filterable:!0,width:"150px",alignment:"left"},{id:"col-3",fieldId:"email",label:"Email Address",type:"string",sortable:!0,filterable:!0,width:"200px",alignment:"left"}],pagination:{enabled:!0,pageSize:50},filtering:{enabled:!0},sorting:{enabled:!0},selection:{enabled:!0},highlighting:{enabled:!0},density:"compact",actions:[]}}},entities:n,onValidate:async()=>[]},parameters:{docs:{description:{story:"Configuration panel for a DataGrid component with advanced settings and multiple columns."}}}},r={args:{component:{...d,configuration:{dataGrid:{entityId:"",columns:[],pagination:{enabled:!0,pageSize:25},filtering:{enabled:!0},sorting:{enabled:!0},actions:[]}}},entities:n,onValidate:async s=>[{field:"entity",message:"Entity selection is required for DataGrid",severity:"error"}]},parameters:{docs:{description:{story:"Configuration panel for a DataGrid component without entity selection, showing validation errors."}}}},a={args:{component:{...N,configuration:{form:{entityId:"customer",fields:[{id:"field-1",fieldId:"first_name",label:"First Name",inputType:"text",required:!0,placeholder:"Enter first name",helpText:"",validation:{required:!0,minLength:2,maxLength:50},layoutProps:{span:6,order:1}},{id:"field-2",fieldId:"last_name",label:"Last Name",inputType:"text",required:!0,placeholder:"Enter last name",helpText:"",validation:{required:!0,minLength:2,maxLength:50},layoutProps:{span:6,order:2}},{id:"field-3",fieldId:"email",label:"Email Address",inputType:"email",required:!0,placeholder:"Enter email address",helpText:"We will never share your email",validation:{required:!0},layoutProps:{span:12,order:3}}],validation:{clientSide:!0,serverSide:!0,realTime:!0},layout:"two-column",submission:{action:"create"}}}},entities:n,onValidate:async()=>[]},parameters:{docs:{description:{story:"Configuration panel for a Form component with configured fields and validation."}}}},o={args:{component:{id:"button-1",type:"TorqueButton",position:{row:0,column:0,rowSpan:1,colSpan:2},configuration:{button:{label:"Save Customer",variant:"filled",color:"blue",size:"md",action:{type:"submitForm"}}},validation:[]},entities:n,onValidate:async()=>[]},parameters:{docs:{description:{story:"Configuration panel for a Button component."}}}};var m,p,c;e.parameters={...e.parameters,docs:{...(m=e.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    component: null,
    entities: mockEntities
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration panel when no component is selected.'
      }
    }
  }
}`,...(c=(p=e.parameters)==null?void 0:p.docs)==null?void 0:c.source}}};var u,f,g;t.parameters={...t.parameters,docs:{...(u=t.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    component: mockDataGridComponent,
    entities: mockEntities,
    onValidate: async component => {
      // Mock validation that always succeeds for configured DataGrid
      return [];
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration panel for a DataGrid component with entity binding.'
      }
    }
  }
}`,...(g=(f=t.parameters)==null?void 0:f.docs)==null?void 0:g.source}}};var y,b,h;i.parameters={...i.parameters,docs:{...(y=i.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    component: {
      ...mockDataGridComponent,
      configuration: {
        dataGrid: {
          entityId: 'customer',
          columns: [{
            id: 'col-1',
            fieldId: 'first_name',
            label: 'First Name',
            type: 'string',
            sortable: true,
            filterable: true,
            width: '150px',
            alignment: 'left'
          }, {
            id: 'col-2',
            fieldId: 'last_name',
            label: 'Last Name',
            type: 'string',
            sortable: true,
            filterable: true,
            width: '150px',
            alignment: 'left'
          }, {
            id: 'col-3',
            fieldId: 'email',
            label: 'Email Address',
            type: 'string',
            sortable: true,
            filterable: true,
            width: '200px',
            alignment: 'left'
          }],
          pagination: {
            enabled: true,
            pageSize: 50
          },
          filtering: {
            enabled: true
          },
          sorting: {
            enabled: true
          },
          selection: {
            enabled: true
          },
          highlighting: {
            enabled: true
          },
          density: 'compact',
          actions: []
        }
      }
    },
    entities: mockEntities,
    onValidate: async () => []
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration panel for a DataGrid component with advanced settings and multiple columns.'
      }
    }
  }
}`,...(h=(b=i.parameters)==null?void 0:b.docs)==null?void 0:h.source}}};var v,w,C;r.parameters={...r.parameters,docs:{...(v=r.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    component: {
      ...mockDataGridComponent,
      configuration: {
        dataGrid: {
          entityId: '',
          columns: [],
          pagination: {
            enabled: true,
            pageSize: 25
          },
          filtering: {
            enabled: true
          },
          sorting: {
            enabled: true
          },
          actions: []
        }
      }
    },
    entities: mockEntities,
    onValidate: async component => {
      return [{
        field: 'entity',
        message: 'Entity selection is required for DataGrid',
        severity: 'error'
      }];
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration panel for a DataGrid component without entity selection, showing validation errors.'
      }
    }
  }
}`,...(C=(w=r.parameters)==null?void 0:w.docs)==null?void 0:C.source}}};var S,x,E;a.parameters={...a.parameters,docs:{...(S=a.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    component: {
      ...mockFormComponent,
      configuration: {
        form: {
          entityId: 'customer',
          fields: [{
            id: 'field-1',
            fieldId: 'first_name',
            label: 'First Name',
            inputType: 'text',
            required: true,
            placeholder: 'Enter first name',
            helpText: '',
            validation: {
              required: true,
              minLength: 2,
              maxLength: 50
            },
            layoutProps: {
              span: 6,
              order: 1
            }
          }, {
            id: 'field-2',
            fieldId: 'last_name',
            label: 'Last Name',
            inputType: 'text',
            required: true,
            placeholder: 'Enter last name',
            helpText: '',
            validation: {
              required: true,
              minLength: 2,
              maxLength: 50
            },
            layoutProps: {
              span: 6,
              order: 2
            }
          }, {
            id: 'field-3',
            fieldId: 'email',
            label: 'Email Address',
            inputType: 'email',
            required: true,
            placeholder: 'Enter email address',
            helpText: 'We will never share your email',
            validation: {
              required: true
            },
            layoutProps: {
              span: 12,
              order: 3
            }
          }],
          validation: {
            clientSide: true,
            serverSide: true,
            realTime: true
          },
          layout: 'two-column',
          submission: {
            action: 'create'
          }
        }
      }
    },
    entities: mockEntities,
    onValidate: async () => []
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration panel for a Form component with configured fields and validation.'
      }
    }
  }
}`,...(E=(x=a.parameters)==null?void 0:x.docs)==null?void 0:E.source}}};var G,q,I;o.parameters={...o.parameters,docs:{...(G=o.parameters)==null?void 0:G.docs,source:{originalSource:`{
  args: {
    component: {
      id: 'button-1',
      type: 'TorqueButton',
      position: {
        row: 0,
        column: 0,
        rowSpan: 1,
        colSpan: 2
      },
      configuration: {
        button: {
          label: 'Save Customer',
          variant: 'filled',
          color: 'blue',
          size: 'md',
          action: {
            type: 'submitForm'
          }
        }
      },
      validation: []
    },
    entities: mockEntities,
    onValidate: async () => []
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration panel for a Button component.'
      }
    }
  }
}`,...(I=(q=o.parameters)==null?void 0:q.docs)==null?void 0:I.source}}};const rn=["NoSelection","DataGridConfiguration","DataGridAdvancedConfiguration","DataGridNoEntity","FormConfiguration","ButtonConfiguration"];export{o as ButtonConfiguration,i as DataGridAdvancedConfiguration,t as DataGridConfiguration,r as DataGridNoEntity,a as FormConfiguration,e as NoSelection,rn as __namedExportsOrder,tn as default};
