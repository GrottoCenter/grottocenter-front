/* eslint-disable react/forbid-prop-types */
import React, { useState, useCallback, useMemo } from 'react';
import { Grid } from '@material-ui/core';
import PropTypes from 'prop-types';
import { isEmpty } from 'ramda';
import GridLine from './Common/GridLine';
import TitleLine from './Common/TitleLine';
import ActionLine from './Common/ActionLine';
import { getDocumentSchema } from './utils/getSchema';
import GridLineCollection from './Common/GridLineCollection';
import shouldLineRender from './utils/shouldLineRender';
import {
  getIdOrUndefined,
  retrieveFromObjectCollection
} from './utils/retrieveFromObjectCollection';

const DocumentsHandler = ({
  duplicate1,
  duplicate2,
  handleSubmit,
  handleNotDuplicatesSubmit,
  title1,
  title2
}) => {
  const [author, setAuthor] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [dateInscription, setDateInscription] = useState('');
  const [datePublication, setDatePublication] = useState('');
  const [dateReviewed, setDateReviewed] = useState('');
  const [authorComment, setauthorComment] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState('');
  const [refBbs, setRefBbs] = useState('');
  const [entrance, setEntrance] = useState('');
  const [cave, setCave] = useState('');
  const [massif, setMassif] = useState('');
  const [editor, setEditor] = useState('');
  const [library, setLibrary] = useState('');
  const [pages, setPages] = useState('');
  const [type, setType] = useState('');
  const [parent, setParent] = useState('');
  const [license, setLicense] = useState('');
  const [authors, setAuthors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [titles, setTitles] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [languages, setLanguages] = useState([]);

  const documentsSchema = useMemo(() => getDocumentSchema(), []);

  // eslint-disable-next-line consistent-return
  const getStateData = (attribute, getState) => {
    switch (attribute) {
      case 'author':
        return getState ? author : setAuthor;
      case 'reviewer':
        return getState ? reviewer : setReviewer;
      case 'datePublication':
        return getState ? datePublication : setDatePublication;
      case 'authorComment':
        return getState ? authorComment : setauthorComment;
      case 'identifier':
        return getState ? identifier : setIdentifier;
      case 'identifierType':
        return getState ? identifierType : setIdentifierType;
      case 'refBbs':
        return getState ? refBbs : setRefBbs;
      case 'entrance':
        return getState ? entrance : setEntrance;
      case 'pages':
        return getState ? pages : setPages;
      case 'dateInscription':
        return getState ? dateInscription : setDateInscription;
      case 'dateReviewed':
        return getState ? dateReviewed : setDateReviewed;
      case 'massif':
        return getState ? massif : setMassif;
      case 'editor':
        return getState ? editor : setEditor;
      case 'library':
        return getState ? library : setLibrary;
      case 'cave':
        return getState ? cave : setCave;
      case 'type':
        return getState ? type : setType;
      case 'intactDescriptions':
        return getState ? descriptions : setDescriptions;
      case 'parent':
        return getState ? parent : setParent;
      case 'license':
        return getState ? license : setLicense;
      case 'authors':
        return getState ? authors : setAuthors;
      case 'subjects':
        return getState ? subjects : setSubjects;
      case 'titles':
        return getState ? titles : setTitles;
      case 'languages':
        return getState ? languages : setLanguages;
      default:
    }
  };

  const isSubmittable = () =>
    !(isEmpty(author) || isEmpty(type) || isEmpty(license));

  const onSubmit = () => {
    const { newItems: newAuthors, previousItems: previousAuthors } =
      retrieveFromObjectCollection(authors);

    const {
      newItems: newPopulatedDescriptions,
      previousItems: previousDescriptions
    } = retrieveFromObjectCollection(descriptions);
    const newDescriptions = newPopulatedDescriptions.map(newDesc => ({
      ...newDesc,
      language: newDesc.language.id
    }));
    handleSubmit(
      {
        id: duplicate1.id || duplicate2.id,
        author: author.id,
        reviewer: getIdOrUndefined(reviewer),
        dateInscription,
        datePublication,
        dateReviewed: dateReviewed === '' ? undefined : dateReviewed,
        authorComment,
        identifier,
        identifierType: getIdOrUndefined(identifierType),
        refBbs,
        entrance: getIdOrUndefined(entrance),
        cave: getIdOrUndefined(cave),
        massif: getIdOrUndefined(massif),
        editor: getIdOrUndefined(editor),
        pages,
        library: getIdOrUndefined(library),
        type: type.id,
        parent: getIdOrUndefined(parent),
        license: license.id,
        authors: previousAuthors,
        subjects: subjects.map(sub => sub.code),
        descriptions: previousDescriptions,
        languages: languages.map(lang => lang.id)
      },
      {
        newAuthors,
        newDescriptions
      }
    );
  };

  const onNotDuplicatesSubmit = () => {
    handleNotDuplicatesSubmit({
      author,
      reviewer,
      dateInscription,
      datePublication,
      dateReviewed,
      authorComment,
      identifier,
      identifierType,
      refBbs,
      entrance,
      cave,
      massif,
      editor,
      pages,
      library,
      type,
      parent,
      license,
      authors,
      subjects,
      titles,
      descriptions,
      languages
    });
  };

  const handleAllClick = useCallback(
    duplicate => {
      documentsSchema.forEach(element => {
        const value = duplicate[element.attribute];
        if (value) {
          getStateData(element.attribute, false)(value);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [duplicate1, duplicate2]
  );

  return (
    <Grid container direction="column" alignItems="center">
      <ActionLine
        handleSubmit={onSubmit}
        handleNotDuplicatesSubmit={onNotDuplicatesSubmit}
        disableSubmit={!isSubmittable()}
      />
      <TitleLine
        title1={title1}
        title2={title2}
        handleAllClick1={() => handleAllClick(duplicate1)}
        handleAllClick2={() => handleAllClick(duplicate2)}
      />
      {documentsSchema.map(line => {
        if (
          shouldLineRender(
            line.isCollection,
            duplicate1[line.attribute],
            duplicate2[line.attribute]
          )
        ) {
          return line.isCollection ? (
            <GridLineCollection
              key={line.label}
              label={line.label}
              value1={duplicate1[line.attribute]}
              value2={duplicate2[line.attribute]}
              render={line.customRender}
              stateValue={getStateData(line.attribute, true)}
              updateState={getStateData(line.attribute, false)}
              disabled={line.disabled}
            />
          ) : (
            <GridLine
              key={line.label}
              label={line.label}
              value1={duplicate1[line.attribute]}
              value2={duplicate2[line.attribute]}
              render={line.customRender}
              stateValue={getStateData(line.attribute, true)}
              updateState={getStateData(line.attribute, false)}
              disabled={line.disabled}
            />
          );
        }
        return '';
      })}
      <ActionLine
        handleSubmit={onSubmit}
        handleNotDuplicatesSubmit={onNotDuplicatesSubmit}
        disableSubmit={!isSubmittable()}
      />
    </Grid>
  );
};

export default DocumentsHandler;

DocumentsHandler.propTypes = {
  duplicate1: PropTypes.object.isRequired,
  duplicate2: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleNotDuplicatesSubmit: PropTypes.func.isRequired,
  title1: PropTypes.string,
  title2: PropTypes.string
};
