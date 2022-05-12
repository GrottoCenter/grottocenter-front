import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { useIntl } from 'react-intl';
import Chip from '@material-ui/core/Chip';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import Paper from '@material-ui/core/Paper';
import {
  fetchAdvancedsearchResults,
  resetAdvancedSearchResults
} from '../../actions/Advancedsearch';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import OrganizationsSearch from '../../components/homepage/advancedSearch/OrganizationsSearch';
import ResultSearchOrganizationsContainer from './ResultSearchOrganizationsContainer';

const startAdvancedsearch = (formValues, resourceType) => dispatch => {
  // complete is set to true because we need the complete results about the data
  const paramsToSend = {
    complete: true,
    resourceType
  };

  Object.keys(formValues).forEach(key => {
    let keyValue = formValues[key];

    // If String trim it
    if (typeof formValues[key] === 'string') {
      keyValue = formValues[key].trim();
    }

    // Handle range values
    if (keyValue !== '' && key.split('-range').length === 1) {
      paramsToSend[key] = keyValue;

      // If the key contains '-range' and it is editable
      // then we send the parameter in two parameters min and max
    } else if (key.split('-range').length > 1 && keyValue.isEditable === true) {
      const keyBase = key.split('-range');
      const rangeMin = `${keyBase[0]}-min`;
      const rangeMax = `${keyBase[0]}-max`;

      paramsToSend[rangeMin] = keyValue.min;
      paramsToSend[rangeMax] = keyValue.max;
    }
  });

  dispatch(fetchAdvancedsearchResults(paramsToSend));
};

const resetAdvancedSearch = () => dispatch => {
  dispatch(resetAdvancedSearchResults());
};

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    listStyle: 'none',
    padding: theme.spacing(0.5),
    margin: 0
  },
  chip: {
    margin: theme.spacing(0.5)
  }
}));

const EditOrganizations = ({ user }) => {
  const classes = useStyles();
  const [orga, setOrga] = React.useState(user.organizations);

  const handleDelete = chipToDelete => () => {
    setOrga(chips => chips.filter(chip => chip.key !== chipToDelete.key));
  };

  const [isAdding, setIsAdding] = React.useState(false);

  const handleAdd = () => {
    setIsAdding(true);
  };

  const { formatMessage } = useIntl();
  return (
    <Layout
      title={formatMessage({ id: 'Organizations' })}
      footer=""
      content={
        <>
          <Paper
            component="ul"
            className={classes.root}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
            {orga.map(data => {
              let icon;

              return (
                <li key={data.key}>
                  <Chip
                    icon={icon}
                    label={data.name}
                    onDelete={handleDelete(data)}
                    className={classes.chip}
                  />
                </li>
              );
            })}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAdd}
                position="center"
                justifyContent="center"
                startIcon={<AddIcon />}
                className={classes.button}>
                Add an organization
              </Button>
            </div>
          </Paper>
          {isAdding ? (
            <>
              <OrganizationsSearch
                startAdvancedsearch={(state, resourceType) => {
                  startAdvancedsearch(state, resourceType);
                }}
                resourceType="grottos"
                resetResults={resetAdvancedSearch}
              />
              <ResultSearchOrganizationsContainer />{' '}
            </>
          ) : (
            ''
          )}
        </>
      }
    />
  );
};

EditOrganizations.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired,
    passwordConfirmation: PropTypes.string.isRequired,
    surname: PropTypes.string.isRequired,
    organizations: PropTypes.shape({
      key: PropTypes.number.isRequired,
      email: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      nickname: PropTypes.string.isRequired,

      surname: PropTypes.string.isRequired
    })
  })
};

export default EditOrganizations;
