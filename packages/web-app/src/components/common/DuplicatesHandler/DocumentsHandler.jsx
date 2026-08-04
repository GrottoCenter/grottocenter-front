/* eslint-disable react/forbid-prop-types */
import React, { useState, useCallback, useMemo } from 'react';
import { Grid } from '@mui/material';
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

// Every collection state starts empty and is only filled when the moderator
// clicks a value, so an empty array means "not touched", not "clear all".
// The API reads an explicit [] as a deliberate clear (it replaces the whole
// collection), so untouched collections must be omitted from the payload.
const onlyIfFilled = collection =>
  collection.length > 0 ? collection : undefined;

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
  const [entrances, setEntrances] = useState([]);
  const [cave, setCave] = useState('');
  const [massif, setMassif] = useState('');
  const [editor, setEditor] = useState('');
  const [library, setLibrary] = useState('');
  const [pages, setPages] = useState('');
  const [type, setType] = useState('');
  const [parent, setParent] = useState('');
  const [license, setLicense] = useState('');
  const [authors, setAuthors] = useState([]);
  const [authorsOrganization, setAuthorsOrganization] = useState([]);
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
      case 'entrances':
        return getState ? entrances : setEntrances;
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
      case 'authorsOrganization':
        return getState ? authorsOrganization : setAuthorsOrganization;
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

    // Organizations-as-authors have no atomic "create + attach" endpoint yet
    // (backend follow-up), so only pre-existing organizations (with an id)
    // can come out of the merge — new items are never produced here.
    const { previousItems: previousAuthorsGrotto } =
      retrieveFromObjectCollection(authorsOrganization);

    const {
      newItems: newPopulatedDescriptions,
      previousItems: previousDescriptions
    } = retrieveFromObjectCollection(descriptions);
    const newDescriptions = newPopulatedDescriptions.map(newDesc => ({
      ...newDesc,
      language: newDesc.language
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
        entrances: entrances.map(e => e.id),
        cave: getIdOrUndefined(cave),
        massif: getIdOrUndefined(massif),
        editor: getIdOrUndefined(editor),
        pages,
        library: getIdOrUndefined(library),
        type: type.id,
        parent: getIdOrUndefined(parent),
        license: license.id,
        authors: onlyIfFilled(previousAuthors),
        authorsGrotto: onlyIfFilled(previousAuthorsGrotto),
        // Subjects coming from the database carry their code as `id` (the
        // TSubject primary key is the `code` column); only subjects coming from
        // an imported duplicate carry a `code` field.
        subjects: onlyIfFilled(subjects.map(sub => sub.id ?? sub.code)),
        descriptions: previousDescriptions,
        // `languages` is stripped by filterDocumentPayload and never reaches
        // the API, so an empty array here has no wipe risk and onlyIfFilled
        // is not needed.
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
      entrances,
      cave,
      massif,
      editor,
      pages,
      library,
      type,
      parent,
      license,
      authors,
      authorsOrganization,
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
