import{j as e}from"./jsx-runtime-CDt2p4po.js";import{C,D as x}from"./ComponentPalette-DdSrXGGH.js";import{M as v}from"./MantineProvider-QIY2Z6QD.js";import"./index-GiUgBvb1.js";import"./index-CROobee-.js";import"./Card-Cdu5HIUj.js";import"./createReactComponent-DeW0SWsj.js";import"./Paper-C74rEzGU.js";import"./Text-DRIe2lk6.js";import"./Stack-BdVTzV5n.js";import"./TextInput-CTL6muRQ.js";import"./InputBase-qatfRSiM.js";import"./floating-ui.react-CpMue5oT.js";import"./UnstyledButton-93KfNP2S.js";import"./IconSearch-DP7S6QkN.js";import"./Badge-DlnNQPvo.js";import"./IconTable-B3Vt8rKG.js";const L={title:"Layout Editor/Component Palette",component:C,parameters:{layout:"padded",docs:{description:{component:"Component palette showing all available TorqueApp components that can be dragged to the layout canvas."}}},decorators:[a=>e.jsx(v,{children:e.jsx(x,{children:e.jsx("div",{style:{width:"300px",height:"600px"},children:e.jsx(a,{})})})})],argTypes:{searchQuery:{control:"text",description:"Filter components by name or description"},onComponentSelect:{action:"component selected"},onSearchChange:{action:"search changed"}}},t={args:{searchQuery:""}},r={args:{searchQuery:"data"},parameters:{docs:{description:{story:"Component palette filtered to show only data-related components."}}}},o={args:{searchQuery:"form"},parameters:{docs:{description:{story:"Component palette filtered to show form-related components."}}}},n={args:{searchQuery:""},play:async({canvasElement:a})=>{},parameters:{docs:{description:{story:"Interactive component palette demonstrating drag and drop functionality."}}}};var s,c,p;t.parameters={...t.parameters,docs:{...(s=t.parameters)==null?void 0:s.docs,source:{originalSource:`{
  args: {
    searchQuery: ''
  }
}`,...(p=(c=t.parameters)==null?void 0:c.docs)==null?void 0:p.source}}};var i,m,d;r.parameters={...r.parameters,docs:{...(i=r.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    searchQuery: 'data'
  },
  parameters: {
    docs: {
      description: {
        story: 'Component palette filtered to show only data-related components.'
      }
    }
  }
}`,...(d=(m=r.parameters)==null?void 0:m.docs)==null?void 0:d.source}}};var l,u,h;o.parameters={...o.parameters,docs:{...(l=o.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    searchQuery: 'form'
  },
  parameters: {
    docs: {
      description: {
        story: 'Component palette filtered to show form-related components.'
      }
    }
  }
}`,...(h=(u=o.parameters)==null?void 0:u.docs)==null?void 0:h.source}}};var y,g,f;n.parameters={...n.parameters,docs:{...(y=n.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    searchQuery: ''
  },
  play: async ({
    canvasElement
  }) => {
    // This story demonstrates the interactive nature of the component
    // In a real implementation, you would use @storybook/test for interactions
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive component palette demonstrating drag and drop functionality.'
      }
    }
  }
}`,...(f=(g=n.parameters)==null?void 0:g.docs)==null?void 0:f.source}}};const O=["Default","WithSearch","FormComponents","Interactive"];export{t as Default,o as FormComponents,n as Interactive,r as WithSearch,O as __namedExportsOrder,L as default};
