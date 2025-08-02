import{j as e}from"./jsx-runtime-CDt2p4po.js";import{T as l,D as c}from"./DataGrid-D5EgSmej.js";import{M as I}from"./MantineProvider-QIY2Z6QD.js";import"./index-GiUgBvb1.js";import"./Text-DRIe2lk6.js";import"./createReactComponent-DeW0SWsj.js";import"./IconTable-B3Vt8rKG.js";import"./Badge-DlnNQPvo.js";import"./Select-ONZWQqDe.js";import"./InputBase-qatfRSiM.js";import"./floating-ui.react-CpMue5oT.js";import"./index-CROobee-.js";import"./UnstyledButton-93KfNP2S.js";import"./FocusTrap-D951crCF.js";import"./Transition-CgjnMQvV.js";import"./use-floating-auto-update-T6hkbBTP.js";const t=({component:u,props:M})=>e.jsx(I,{children:e.jsx("div",{style:{padding:"20px",backgroundColor:"#f8f9fa",minHeight:"200px"},children:e.jsx(u.render,{...M})})}),te={title:"Layout Editor/Torque Components",parameters:{layout:"centered",docs:{description:{component:"Individual Torque Components that can be used within the Visual Layout Editor. These components are configured for use with the Puck editor."}}},decorators:[u=>e.jsx(I,{children:e.jsx("div",{style:{padding:"16px"},children:e.jsx(u,{})})})]},r={render:()=>e.jsx(t,{component:l,props:{content:"Welcome to Torque",variant:"h1",alignment:"center",color:"#1f2937",weight:"bold"}}),parameters:{docs:{description:{story:"Text component configured as a large heading with centered alignment and bold weight."}}}},o={render:()=>e.jsx(t,{component:l,props:{content:"This is a paragraph of body text that demonstrates how the Text component renders regular content with default styling.",variant:"body",alignment:"left",weight:"normal"}}),parameters:{docs:{description:{story:"Text component configured as body text with left alignment and normal weight."}}}},a={render:()=>e.jsx(t,{component:l,props:{content:"Last updated: January 15, 2024",variant:"caption",alignment:"right",color:"#6b7280",weight:"normal"}}),parameters:{docs:{description:{story:"Text component configured as a caption with smaller text, right alignment, and gray color."}}}},n={render:()=>e.jsx(t,{component:c,props:{entityType:"project",columns:[{field:"id",header:"ID",type:"text",sortable:!0,filterable:!0},{field:"name",header:"Name",type:"text",sortable:!0,filterable:!0},{field:"status",header:"Status",type:"status",sortable:!0,filterable:!0}],showPagination:!0,pageSize:10,showFilters:!1,showSearch:!0,height:"300px"}}),parameters:{docs:{description:{story:"Basic DataGrid component with project data, search functionality, and pagination."}}}},i={render:()=>e.jsx(t,{component:c,props:{entityType:"project",columns:[{field:"id",header:"ID",type:"text",sortable:!0,filterable:!0},{field:"name",header:"Project Name",type:"text",sortable:!0,filterable:!0},{field:"priority",header:"Priority",type:"text",sortable:!0,filterable:!0},{field:"status",header:"Status",type:"status",sortable:!0,filterable:!0},{field:"due_date",header:"Due Date",type:"date",sortable:!0,filterable:!0}],showPagination:!0,pageSize:5,showFilters:!0,showSearch:!0,height:"400px"}}),parameters:{docs:{description:{story:"DataGrid component with full feature set including column filters, search, sorting, and pagination."}}}},s={render:()=>e.jsx(t,{component:c,props:{entityType:"task",columns:[{field:"id",header:"ID",type:"text",sortable:!1,filterable:!1,width:60},{field:"title",header:"Task",type:"text",sortable:!0,filterable:!1},{field:"completed",header:"Done",type:"boolean",sortable:!0,filterable:!1,width:80}],showPagination:!1,pageSize:20,showFilters:!1,showSearch:!1,height:"250px"}}),parameters:{docs:{description:{story:"Compact DataGrid configuration with minimal features and fixed column widths."}}}},d={render:()=>e.jsxs("div",{style:{padding:"20px",backgroundColor:"#fef3c7",border:"1px solid #f59e0b",borderRadius:"8px"},children:[e.jsx("h3",{style:{margin:"0 0 10px 0",color:"#92400e"},children:"Container Component"}),e.jsx("p",{style:{margin:0,color:"#92400e"},children:"The Container component uses Puck's DropZone and needs to be rendered within the Visual Layout Editor context. It can be seen in action in the main Visual Layout Editor stories."})]}),parameters:{docs:{description:{story:"Container component requires Puck context to function properly - see Visual Layout Editor stories for usage examples."}}}},p={render:()=>e.jsxs("div",{style:{padding:"20px"},children:[e.jsx("h2",{children:"Torque Component Configurations"}),e.jsx("p",{children:"These are the component configurations available in the Visual Layout Editor:"}),e.jsxs("div",{style:{display:"grid",gap:"20px",marginTop:"20px"},children:[e.jsxs("div",{style:{border:"1px solid #e5e7eb",borderRadius:"8px",padding:"16px"},children:[e.jsx("h3",{children:"Text Component"}),e.jsx("p",{children:e.jsx("strong",{children:"Default Props:"})}),e.jsx("pre",{style:{fontSize:"12px",backgroundColor:"#f3f4f6",padding:"8px",borderRadius:"4px"},children:JSON.stringify(l.defaultProps,null,2)})]}),e.jsxs("div",{style:{border:"1px solid #e5e7eb",borderRadius:"8px",padding:"16px"},children:[e.jsx("h3",{children:"DataGrid Component"}),e.jsx("p",{children:e.jsx("strong",{children:"Default Props:"})}),e.jsx("pre",{style:{fontSize:"12px",backgroundColor:"#f3f4f6",padding:"8px",borderRadius:"4px"},children:JSON.stringify(c.defaultProps,null,2)})]}),e.jsxs("div",{style:{border:"1px solid #e5e7eb",borderRadius:"8px",padding:"16px"},children:[e.jsx("h3",{children:"Container Component"}),e.jsxs("p",{children:[e.jsx("strong",{children:"Note:"})," Container component is available in the Visual Layout Editor but requires Puck context to render properly."]}),e.jsx("p",{children:e.jsx("strong",{children:"Default Props:"})}),e.jsxs("ul",{style:{fontSize:"12px",marginTop:"8px"},children:[e.jsx("li",{children:'padding: "16px"'}),e.jsx("li",{children:'borderRadius: "8px"'}),e.jsx("li",{children:'minHeight: "100px"'}),e.jsx("li",{children:'backgroundColor: "#f8f9fa"'})]})]})]})]}),parameters:{docs:{description:{story:"Overview of all Torque Component configurations showing their default properties and available options."}}}};var m,h,f;r.parameters={...r.parameters,docs:{...(m=r.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <MockRender component={TextComponent} props={{
    content: "Welcome to Torque",
    variant: "h1",
    alignment: "center",
    color: "#1f2937",
    weight: "bold"
  }} />,
  parameters: {
    docs: {
      description: {
        story: 'Text component configured as a large heading with centered alignment and bold weight.'
      }
    }
  }
}`,...(f=(h=r.parameters)==null?void 0:h.docs)==null?void 0:f.source}}};var x,g,y;o.parameters={...o.parameters,docs:{...(x=o.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <MockRender component={TextComponent} props={{
    content: "This is a paragraph of body text that demonstrates how the Text component renders regular content with default styling.",
    variant: "body",
    alignment: "left",
    weight: "normal"
  }} />,
  parameters: {
    docs: {
      description: {
        story: 'Text component configured as body text with left alignment and normal weight.'
      }
    }
  }
}`,...(y=(g=o.parameters)==null?void 0:g.docs)==null?void 0:y.source}}};var b,w,C;a.parameters={...a.parameters,docs:{...(b=a.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <MockRender component={TextComponent} props={{
    content: "Last updated: January 15, 2024",
    variant: "caption",
    alignment: "right",
    color: "#6b7280",
    weight: "normal"
  }} />,
  parameters: {
    docs: {
      description: {
        story: 'Text component configured as a caption with smaller text, right alignment, and gray color.'
      }
    }
  }
}`,...(C=(w=a.parameters)==null?void 0:w.docs)==null?void 0:C.source}}};var j,T,D;n.parameters={...n.parameters,docs:{...(j=n.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <MockRender component={DataGridComponent} props={{
    entityType: "project",
    columns: [{
      field: "id",
      header: "ID",
      type: "text",
      sortable: true,
      filterable: true
    }, {
      field: "name",
      header: "Name",
      type: "text",
      sortable: true,
      filterable: true
    }, {
      field: "status",
      header: "Status",
      type: "status",
      sortable: true,
      filterable: true
    }],
    showPagination: true,
    pageSize: 10,
    showFilters: false,
    showSearch: true,
    height: "300px"
  }} />,
  parameters: {
    docs: {
      description: {
        story: 'Basic DataGrid component with project data, search functionality, and pagination.'
      }
    }
  }
}`,...(D=(T=n.parameters)==null?void 0:T.docs)==null?void 0:D.source}}};var v,S,P;i.parameters={...i.parameters,docs:{...(v=i.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <MockRender component={DataGridComponent} props={{
    entityType: "project",
    columns: [{
      field: "id",
      header: "ID",
      type: "text",
      sortable: true,
      filterable: true
    }, {
      field: "name",
      header: "Project Name",
      type: "text",
      sortable: true,
      filterable: true
    }, {
      field: "priority",
      header: "Priority",
      type: "text",
      sortable: true,
      filterable: true
    }, {
      field: "status",
      header: "Status",
      type: "status",
      sortable: true,
      filterable: true
    }, {
      field: "due_date",
      header: "Due Date",
      type: "date",
      sortable: true,
      filterable: true
    }],
    showPagination: true,
    pageSize: 5,
    showFilters: true,
    showSearch: true,
    height: "400px"
  }} />,
  parameters: {
    docs: {
      description: {
        story: 'DataGrid component with full feature set including column filters, search, sorting, and pagination.'
      }
    }
  }
}`,...(P=(S=i.parameters)==null?void 0:S.docs)==null?void 0:P.source}}};var k,R,G;s.parameters={...s.parameters,docs:{...(k=s.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => <MockRender component={DataGridComponent} props={{
    entityType: "task",
    columns: [{
      field: "id",
      header: "ID",
      type: "text",
      sortable: false,
      filterable: false,
      width: 60
    }, {
      field: "title",
      header: "Task",
      type: "text",
      sortable: true,
      filterable: false
    }, {
      field: "completed",
      header: "Done",
      type: "boolean",
      sortable: true,
      filterable: false,
      width: 80
    }],
    showPagination: false,
    pageSize: 20,
    showFilters: false,
    showSearch: false,
    height: "250px"
  }} />,
  parameters: {
    docs: {
      description: {
        story: 'Compact DataGrid configuration with minimal features and fixed column widths.'
      }
    }
  }
}`,...(G=(R=s.parameters)==null?void 0:R.docs)==null?void 0:G.source}}};var E,L,q;d.parameters={...d.parameters,docs:{...(E=d.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => <div style={{
    padding: '20px',
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px'
  }}>
      <h3 style={{
      margin: '0 0 10px 0',
      color: '#92400e'
    }}>Container Component</h3>
      <p style={{
      margin: 0,
      color: '#92400e'
    }}>
        The Container component uses Puck's DropZone and needs to be rendered within the Visual Layout Editor context. 
        It can be seen in action in the main Visual Layout Editor stories.
      </p>
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Container component requires Puck context to function properly - see Visual Layout Editor stories for usage examples.'
      }
    }
  }
}`,...(q=(L=d.parameters)==null?void 0:L.docs)==null?void 0:q.source}}};var z,N,V;p.parameters={...p.parameters,docs:{...(z=p.parameters)==null?void 0:z.docs,source:{originalSource:`{
  render: () => <div style={{
    padding: '20px'
  }}>
      <h2>Torque Component Configurations</h2>
      <p>These are the component configurations available in the Visual Layout Editor:</p>
      
      <div style={{
      display: 'grid',
      gap: '20px',
      marginTop: '20px'
    }}>
        <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px'
      }}>
          <h3>Text Component</h3>
          <p><strong>Default Props:</strong></p>
          <pre style={{
          fontSize: '12px',
          backgroundColor: '#f3f4f6',
          padding: '8px',
          borderRadius: '4px'
        }}>
            {JSON.stringify(TextComponent.defaultProps, null, 2)}
          </pre>
        </div>
        
        <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px'
      }}>
          <h3>DataGrid Component</h3>
          <p><strong>Default Props:</strong></p>
          <pre style={{
          fontSize: '12px',
          backgroundColor: '#f3f4f6',
          padding: '8px',
          borderRadius: '4px'
        }}>
            {JSON.stringify(DataGridComponent.defaultProps, null, 2)}
          </pre>
        </div>
        
        <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px'
      }}>
          <h3>Container Component</h3>
          <p><strong>Note:</strong> Container component is available in the Visual Layout Editor but requires Puck context to render properly.</p>
          <p><strong>Default Props:</strong></p>
          <ul style={{
          fontSize: '12px',
          marginTop: '8px'
        }}>
            <li>padding: "16px"</li>
            <li>borderRadius: "8px"</li>
            <li>minHeight: "100px"</li>
            <li>backgroundColor: "#f8f9fa"</li>
          </ul>
        </div>
      </div>
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Overview of all Torque Component configurations showing their default properties and available options.'
      }
    }
  }
}`,...(V=(N=p.parameters)==null?void 0:N.docs)==null?void 0:V.source}}};const re=["TextHeading","TextParagraph","TextCaption","DataGridBasic","DataGridWithFilters","DataGridCompact","ContainerNote","ComponentConfigurations"];export{p as ComponentConfigurations,d as ContainerNote,n as DataGridBasic,s as DataGridCompact,i as DataGridWithFilters,a as TextCaption,r as TextHeading,o as TextParagraph,re as __namedExportsOrder,te as default};
