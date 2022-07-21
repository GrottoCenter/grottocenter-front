import { Typography, List, ListItemText } from '@material-ui/core';
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { isEmpty, isNil, is } from 'ramda';
import { Skeleton, TreeItem, TreeView as MuiTreeView } from '@material-ui/lab';
import { ExpandMore, ChevronRight, Launch } from '@material-ui/icons';

import { isMobileOnly } from 'react-device-detect';

import GCLink from '../../components/common/GCLink';

// ==========

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 35px;
  margin: 0 ${({ theme }) => theme.spacing(3)}px;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const WrapperListItem = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ToRightListItemText = styled(ListItemText)`
  text-align: right;
`;

const Label = styled(Typography)`
  margin-right: ${({ theme }) => theme.spacing(2)}px;
  text-transform: uppercase;
`;

const IconContainer = styled.div`
  min-width: ${isMobileOnly ? '0' : '15rem'};
  display: flex;
  justify-content: center;
`;

const FollowURLIcon = styled(Launch)`
  margin-left: ${({ theme }) => theme.spacing(2)}px;
  vertical-align: bottom;
`;

const IconAndLabelWrapper = styled.span`
  align-items: center;
  align-self: ${props => (props.isLabelAndIconOnTop ? 'flex-start' : 'center')};
  display: flex;
`;

const ValueContainer = styled.div`
  flex: 1;
  margin-right: ${isMobileOnly ? '5%' : '20%'};
  text-align: right;
`;

const TreeView = styled(MuiTreeView)`
  text-align: left;
`;

const isArray = is(Array);
const isString = is(String);

// ==========

const ChildTreeItem = ({ item }) => {
  const { id, url, title, childrenData } = item;
  return (
    <TreeItem
      nodeId={String(id)}
      label={
        <>
          {title}
          <GCLink href={url}>
            <FollowURLIcon fontSize="small" />
          </GCLink>
        </>
      }>
      {childrenData &&
        childrenData.map(c => <ChildTreeItem key={c.id} item={c} />)}
    </TreeItem>
  );
};

const Item = ({
  Icon,
  label,
  type,
  url,
  value,
  CustomComponent,
  CustomComponentProps,
  internalUrl = false,
  isLabelAndIconOnTop = false,
  isLoading = false
}) => (
  <Wrapper>
    <IconAndLabelWrapper isLabelAndIconOnTop={isLabelAndIconOnTop}>
      <IconContainer>{!isNil(Icon) && <Icon />}</IconContainer>
      <Label color="textSecondary" variant="caption">
        {' '}
        {`${label}: `}
        &nbsp;
      </Label>
    </IconAndLabelWrapper>
    <ValueContainer>
      {isLoading && <Skeleton variant="rect" height={200} />}
      {!isLoading && !isEmpty(value) && !isNil(value) && (
        <>
          {type === 'tree' && isArray(value) && (
            <TreeView
              defaultCollapseIcon={<ExpandMore />}
              defaultExpandIcon={<ChevronRight />}>
              {value.map(child => (
                <ChildTreeItem key={child.id} item={child} />
              ))}
            </TreeView>
          )}
          {type === 'list' && isArray(value) && (
            <List>
              {value.map((item, index) => {
                const props = CustomComponentProps
                  ? CustomComponentProps[index]
                  : {};

                const Component = CustomComponent || ToRightListItemText;

                return (
                  <WrapperListItem key={item}>
                    <Component {...props}>{item}</Component>
                  </WrapperListItem>
                );
              })}
            </List>
          )}
          {isString(value) &&
            (url ? (
              <GCLink href={url} internal={internalUrl}>
                {value}
              </GCLink>
            ) : (
              <Typography>{value}</Typography>
            ))}
        </>
      )}
    </ValueContainer>
  </Wrapper>
);

const Section = ({ title, content, loading }) => {
  const isValueNotEmpty = value => !isEmpty(value) && !isNil(value);
  return (
    <ContentWrapper>
      <Typography color="textSecondary" variant="h6" gutterBottom>
        {title}
      </Typography>
      {loading ? (
        <Skeleton variant="rect" height={100} />
      ) : (
        content.map(
          item =>
            /* Display item if :
                - it's loading => a value will be displayed later
                - it's not loading => a value must be set before rendering an <Item>
              */
            (item.isLoading || isValueNotEmpty(item.value)) && (
              <Item
                key={item.label}
                Icon={item.Icon}
                label={item.label}
                type={item.type}
                internalUrl={item.internalUrl}
                url={item.url}
                value={item.value}
                CustomComponent={item.CustomComponent}
                CustomComponentProps={item.CustomComponentProps}
                isLabelAndIconOnTop={item.isLabelAndIconOnTop}
                isLoading={item.isLoading}
              />
            )
        )
      )}
    </ContentWrapper>
  );
};

export default Section;

// Recursive PropTypes : https://stackoverflow.com/questions/32063297/can-a-react-prop-type-be-defined-recursively/52411570
const childTreeItemShape = {
  id: PropTypes.number.isRequired,
  internalUrl: PropTypes.bool,
  title: PropTypes.string.isRequired,
  url: PropTypes.string
};
childTreeItemShape.childrenData = PropTypes.arrayOf(
  PropTypes.shape(childTreeItemShape)
);
ChildTreeItem.propTypes = {
  item: PropTypes.shape(childTreeItemShape)
};

Item.propTypes = {
  Icon: PropTypes.func,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.arrayOf(PropTypes.shape({}))
  ]),
  type: PropTypes.oneOf(['list', 'tree']),
  internalUrl: PropTypes.bool,
  url: PropTypes.string,
  CustomComponent: PropTypes.node,
  CustomComponentProps: PropTypes.shape({}),
  isLabelAndIconOnTop: PropTypes.bool,
  isLoading: PropTypes.bool
};

Section.propTypes = {
  loading: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.arrayOf(
    PropTypes.oneOf([PropTypes.shape(Item.propTypes), PropTypes.node])
  )
};
