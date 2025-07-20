import { Config } from '@measured/puck';
import { TextComponent } from './Text';
import { ContainerComponent } from './Container';
import { DataGridComponent } from './DataGrid';
import { TorqueFormComponent } from './TorqueForm';
import { TorqueButtonComponent } from './TorqueButton';

export const TorqueComponentConfig: Config = {
  components: {
    Text: TextComponent,
    Container: ContainerComponent,
    DataGrid: DataGridComponent,
    TorqueForm: TorqueFormComponent,
    TorqueButton: TorqueButtonComponent,
  },
  root: {
    fields: {
      title: {
        type: 'text',
        label: 'Page Title'
      }
    }
  },
  categories: {
    layout: {
      title: 'Layout Components',
      components: ['Container']
    },
    content: {
      title: 'Content Components', 
      components: ['Text']
    },
    data: {
      title: 'Data Components',
      components: ['DataGrid']
    },
    interactive: {
      title: 'Interactive Components',
      components: ['TorqueForm', 'TorqueButton']
    }
  }
};

// Factory function to create config with entities context
export const createTorqueComponentConfig = (entities: any[]): Config => {
  return {
    components: {
      Text: TextComponent,
      Container: ContainerComponent,
      DataGrid: {
        ...DataGridComponent,
        fields: {
          ...DataGridComponent.fields,
          entityType: {
            type: 'select',
            label: 'Entity Type',
            options: entities
              .filter((entity: any, index: number, arr: any[]) => 
                arr.findIndex(e => e.name === entity.name) === index
              )
              .map((entity: any) => ({
                label: `${entity.displayName || entity.name} (${entity.name})`,
                value: entity.name
              }))
          }
        }
      },
      TorqueForm: {
        ...TorqueFormComponent,
        fields: {
          ...TorqueFormComponent.fields,
          entityType: {
            type: 'select',
            label: 'Entity Type',
            options: entities
              .filter((entity: any, index: number, arr: any[]) => 
                arr.findIndex(e => e.name === entity.name) === index
              )
              .map((entity: any) => ({
                label: `${entity.displayName || entity.name} (${entity.name})`,
                value: entity.name
              }))
          }
        }
      },
      TorqueButton: TorqueButtonComponent,
    },
    root: {
      fields: {
        title: {
          type: 'text',
          label: 'Page Title'
        }
      }
    },
    categories: {
      layout: {
        title: 'Layout Components',
        components: ['Container']
      },
      content: {
        title: 'Content Components', 
        components: ['Text']
      },
      data: {
        title: 'Data Components',
        components: ['DataGrid']
      },
      interactive: {
        title: 'Interactive Components',
        components: ['TorqueForm', 'TorqueButton']
      }
    }
  };
};

// Export individual components for potential separate use
export { TextComponent } from './Text';
export { ContainerComponent } from './Container';
export { DataGridComponent } from './DataGrid';
export { TorqueFormComponent } from './TorqueForm';
export { TorqueButtonComponent } from './TorqueButton';