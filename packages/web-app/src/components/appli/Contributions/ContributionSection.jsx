import { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Divider, List } from '@mui/material';
import ScrollableContent from '@/components/common/Layouts/Fixed/ScrollableContent';
import { sortByRelevance } from '@/helpers/sortByRelevance';

const ContributionSection = ({
  title,
  anchorId,
  items,
  renderItem,
  createAction,
  form,
  emptyState,
  beforeContent,
  defaultExpanded = items.length > 0
}) => {
  const sorted = useMemo(() => sortByRelevance(items), [items]);
  const activeIds = sorted.filter(item => !item.isDeleted).map(item => item.id);

  return (
    <ScrollableContent
      dense
      anchorId={anchorId}
      defaultExpanded={defaultExpanded}
      title={title}
      icon={createAction}
      content={
        <>
          {beforeContent}
          {form && (
            <>
              {form}
              <Divider />
            </>
          )}
          {items.length > 0 ? (
            <List dense disablePadding>
              {sorted.map(item => (
                <Fragment key={item.id}>
                  {renderItem(item, {
                    isFirst: item.id === activeIds[0],
                    isLast: item.id === activeIds[activeIds.length - 1]
                  })}
                </Fragment>
              ))}
            </List>
          ) : (
            emptyState
          )}
        </>
      }
    />
  );
};

ContributionSection.propTypes = {
  title: PropTypes.string.isRequired,
  anchorId: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      relevance: PropTypes.number,
      isDeleted: PropTypes.bool
    })
  ).isRequired,
  renderItem: PropTypes.func.isRequired,
  createAction: PropTypes.node,
  form: PropTypes.node,
  emptyState: PropTypes.node,
  beforeContent: PropTypes.node,
  defaultExpanded: PropTypes.bool
};

export default ContributionSection;
