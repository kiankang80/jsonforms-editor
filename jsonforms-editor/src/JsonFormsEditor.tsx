/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2020 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import './JsonFormsEditor.css';
import 'react-reflex/styles.css';

import { makeStyles } from '@material-ui/core';
import React, { useEffect, useReducer, useState } from 'react';
import { DndProvider } from 'react-dnd';
import Backend from 'react-dnd-html5-backend';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';

import {
  ExamplePaletteService,
  PaletteService,
} from './core/api/paletteService';
import { ExampleSchemaService, SchemaService } from './core/api/schemaService';
import { Layout } from './core/components';
import { EditorContextInstance } from './core/context';
import { Actions, editorReducer } from './core/model';
import { SelectedElement } from './core/selection';
import { tryFindByUUID } from './core/util/schemasUtil';
import { EditorPanel } from './editor';
import { PalettePanel } from './palette-panel';
import { PropertiesPanel } from './properties';
import {
  PropertiesService,
  PropertiesServiceImpl,
  PropertySchemasDecorator,
  PropertySchemasProvider,
} from './properties/propertiesService';

const useStyles = makeStyles((theme) => ({
  leftPane: {
    minHeight: '200px',
    margin: theme.spacing(0, 1, 0, 1),
  },
  centerPane: {
    minHeight: '200px',
    margin: theme.spacing(0, 1, 0, 1),
    height: '100%',
    alignItems: 'stretch',
  },
  rightPane: {
    minHeight: '200px',
    margin: theme.spacing(0, 1, 0, 1),
  },
  reflexContainer: {
    flex: '1',
    alignItems: 'stretch',
  },
}));

interface JsonFormsEditorProps {
  schemaProviders: PropertySchemasProvider[];
  schemaDecorators: PropertySchemasDecorator[];
}
export const JsonFormsEditor: React.FC<JsonFormsEditorProps> = ({
  schemaProviders,
  schemaDecorators,
}) => {
  const [{ schema, uiSchema }, dispatch] = useReducer(editorReducer, {});
  const [selection, setSelection] = useState<SelectedElement>(undefined);
  const [schemaService] = useState<SchemaService>(new ExampleSchemaService());
  const [paletteService] = useState<PaletteService>(
    new ExamplePaletteService()
  );
  const [propertiesService] = useState<PropertiesService>(
    new PropertiesServiceImpl(schemaProviders, schemaDecorators)
  );
  useEffect(() => {
    schemaService
      .getSchema()
      .then((schema) => dispatch(Actions.setSchema(schema)));
    schemaService
      .getUiSchema()
      .then((uiSchema) => dispatch(Actions.setUiSchema(uiSchema)));
  }, [schemaService]);
  useEffect(() => {
    setSelection((oldSelection) => {
      if (!oldSelection) {
        return oldSelection;
      }
      const idInNewSchema = tryFindByUUID(uiSchema, oldSelection.uuid);
      if (!idInNewSchema) {
        // element does not exist anymore - clear old selection
        return undefined;
      }
      return oldSelection;
    });
  }, [uiSchema]);
  return (
    <EditorContextInstance.Provider
      value={{
        schema,
        uiSchema,
        dispatch,
        selection,
        setSelection,
        schemaService,
        paletteService,
        propertiesService,
      }}
    >
      <DndProvider backend={Backend}>
        <JsonFormsEditorUi />
      </DndProvider>
    </EditorContextInstance.Provider>
  );
};

const JsonFormsEditorUi = () => {
  const classes = useStyles();
  return (
    <Layout>
      <ReflexContainer
        orientation='vertical'
        className={classes.reflexContainer}
      >
        <ReflexElement minSize={200}>
          <div className={classes.leftPane}>
            <PalettePanel />
          </div>
        </ReflexElement>
        <ReflexSplitter propagate />
        <ReflexElement minSize={200}>
          <div className={classes.centerPane}>
            <EditorPanel />
          </div>
        </ReflexElement>
        <ReflexSplitter propagate />
        <ReflexElement minSize={200}>
          <div className={classes.rightPane}>
            <PropertiesPanel />
          </div>
        </ReflexElement>
      </ReflexContainer>
    </Layout>
  );
};
