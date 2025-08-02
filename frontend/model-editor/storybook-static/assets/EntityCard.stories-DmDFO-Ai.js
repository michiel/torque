import{j as e}from"./jsx-runtime-CDt2p4po.js";import{M as _}from"./MantineProvider-QIY2Z6QD.js";import{C as p}from"./Card-Cdu5HIUj.js";import{G as d,T as t}from"./Text-DRIe2lk6.js";import{I as O}from"./IconDatabase-BwcsqcPj.js";import{B as v}from"./Badge-DlnNQPvo.js";import{S as G}from"./Stack-BdVTzV5n.js";import{B as u}from"./Button-DxGj0eyG.js";import{I as M}from"./IconEdit-Czy5EC8b.js";import{I as P}from"./IconTrash-eEDGOZ4_.js";import"./index-GiUgBvb1.js";import"./createReactComponent-DeW0SWsj.js";import"./Paper-C74rEzGU.js";import"./Transition-CgjnMQvV.js";import"./index-CROobee-.js";import"./UnstyledButton-93KfNP2S.js";const V=({name:a,displayName:z,description:m,entityType:c,fieldsCount:A,onEdit:L,onDelete:b})=>{const B=I=>{switch(I){case"Data":return"blue";case"Lookup":return"green";case"Audit":return"yellow";case"Temporary":return"orange";case"View":return"purple";default:return"gray"}};return e.jsxs(p,{shadow:"sm",padding:"lg",radius:"md",withBorder:!0,children:[e.jsx(p.Section,{withBorder:!0,inheritPadding:!0,py:"xs",children:e.jsxs(d,{justify:"space-between",children:[e.jsxs(d,{children:[e.jsx(O,{size:16}),e.jsx(t,{fw:500,children:z})]}),e.jsx(v,{color:B(c),size:"sm",children:c})]})}),e.jsxs(G,{gap:"xs",mt:"md",children:[e.jsxs(t,{size:"sm",c:"dimmed",children:[e.jsx("strong",{children:"Name:"})," ",a]}),m&&e.jsxs(t,{size:"sm",c:"dimmed",children:[e.jsx("strong",{children:"Description:"})," ",m]}),e.jsxs(t,{size:"sm",c:"dimmed",children:[e.jsx("strong",{children:"Fields:"})," ",A]})]}),e.jsxs(d,{justify:"flex-end",mt:"md",children:[e.jsx(u,{variant:"light",color:"blue",size:"sm",leftSection:e.jsx(M,{size:14}),onClick:L,children:"Edit"}),e.jsx(u,{variant:"light",color:"red",size:"sm",leftSection:e.jsx(P,{size:14}),onClick:b,children:"Delete"})]})]})},se={title:"Components/EntityCard",component:V,parameters:{layout:"centered"},decorators:[a=>e.jsx(_,{children:e.jsx("div",{style:{width:"400px"},children:e.jsx(a,{})})})],argTypes:{entityType:{control:"select",options:["Data","Lookup","Audit","Temporary","View"]},fieldsCount:{control:"number"},onEdit:{action:"edit clicked"},onDelete:{action:"delete clicked"}}},r={args:{name:"customer",displayName:"Customer",description:"Customer information and contact details",entityType:"Data",fieldsCount:8}},s={args:{name:"order",displayName:"Order",description:"Customer orders with items and payment information",entityType:"Data",fieldsCount:12}},o={args:{name:"country",displayName:"Country",description:"Country lookup table",entityType:"Lookup",fieldsCount:3}},n={args:{name:"audit_log",displayName:"Audit Log",description:"System audit trail",entityType:"Audit",fieldsCount:6}},i={args:{name:"temp_data",displayName:"Temporary Data",entityType:"Temporary",fieldsCount:4}};var l,y,g;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    name: 'customer',
    displayName: 'Customer',
    description: 'Customer information and contact details',
    entityType: 'Data',
    fieldsCount: 8
  }
}`,...(g=(y=r.parameters)==null?void 0:y.docs)==null?void 0:g.source}}};var f,h,x;s.parameters={...s.parameters,docs:{...(f=s.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    name: 'order',
    displayName: 'Order',
    description: 'Customer orders with items and payment information',
    entityType: 'Data',
    fieldsCount: 12
  }
}`,...(x=(h=s.parameters)==null?void 0:h.docs)==null?void 0:x.source}}};var C,j,T;o.parameters={...o.parameters,docs:{...(C=o.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    name: 'country',
    displayName: 'Country',
    description: 'Country lookup table',
    entityType: 'Lookup',
    fieldsCount: 3
  }
}`,...(T=(j=o.parameters)==null?void 0:j.docs)==null?void 0:T.source}}};var E,D,k;n.parameters={...n.parameters,docs:{...(E=n.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    name: 'audit_log',
    displayName: 'Audit Log',
    description: 'System audit trail',
    entityType: 'Audit',
    fieldsCount: 6
  }
}`,...(k=(D=n.parameters)==null?void 0:D.docs)==null?void 0:k.source}}};var w,S,N;i.parameters={...i.parameters,docs:{...(w=i.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    name: 'temp_data',
    displayName: 'Temporary Data',
    entityType: 'Temporary',
    fieldsCount: 4
  }
}`,...(N=(S=i.parameters)==null?void 0:S.docs)==null?void 0:N.source}}};const oe=["CustomerEntity","OrderEntity","LookupEntity","AuditEntity","WithoutDescription"];export{n as AuditEntity,r as CustomerEntity,o as LookupEntity,s as OrderEntity,i as WithoutDescription,oe as __namedExportsOrder,se as default};
