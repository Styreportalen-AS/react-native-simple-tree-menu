import React from 'react';
import { debounce } from 'lodash';

import walk, {
  TreeNode,
  Item,
  TreeNodeInArray,
  LocaleFunction,
  MatchSearchFunction,
} from './walk';
import { defaultChildren, TreeMenuChildren, TreeMenuItem } from './renderProps';

type TreeMenuProps = {
  data: { [name: string]: TreeNode } | TreeNodeInArray[];
  activeKey?: string;
  focusKey?: string;
  initialActiveKey?: string;
  initialFocusKey?: string;
  initialOpenNodes?: string[];
  openNodes?: string[];
  hasSearch?: boolean;
  onClickItem: (props: Item) => void;
  debounceTime: number;
  children: TreeMenuChildren;
  locale?: LocaleFunction;
  matchSearch?: MatchSearchFunction;
  keyDownConfig?: object;
};

type TreeMenuState = {
  openNodes: string[];
  searchTerm: string;
  activeKey: string;
  focusKey: string;
};

const defaultOnClick = (props: Item) => console.log(props); // eslint-disable-line no-console

class TreeMenu extends React.Component<TreeMenuProps, TreeMenuState> {
  static defaultProps: TreeMenuProps = {
    data: {},
    onClickItem: defaultOnClick,
    debounceTime: 125,
    children: defaultChildren,
    hasSearch: true,
  };

  state: TreeMenuState = {
    openNodes: this.props.initialOpenNodes || [],
    searchTerm: '',
    activeKey: this.props.initialActiveKey || '',
    focusKey: this.props.initialFocusKey || '',
  };

  search = (value: string) => {
    const { debounceTime } = this.props;
    const search = debounce(
      (searchTerm: string) => this.setState({ searchTerm }),
      debounceTime
    );
    search(value);
  };

  toggleNode = (node: string) => {
    if (!this.props.openNodes) {
      const { openNodes } = this.state;
      const newOpenNodes = openNodes.includes(node)
        ? openNodes.filter(openNode => openNode !== node)
        : [...openNodes, node];
      this.setState({ openNodes: newOpenNodes });
    }
  };

  generateItems = (): TreeMenuItem[] => {
    const { data, onClickItem, locale, matchSearch } = this.props;
    const { searchTerm } = this.state;
    const openNodes = this.props.openNodes || this.state.openNodes;
    const activeKey = this.props.activeKey || this.state.activeKey;
    const focusKey = this.props.focusKey || this.state.focusKey;

    const items: Item[] = data
      ? walk({ data, openNodes, searchTerm, locale, matchSearch })
      : [];

    return items.map(item => {
      const focus = item.key === focusKey;
      const active = item.key === activeKey;
      const onClick = () => {
        const newActiveKey = this.props.activeKey || item.key;
        this.setState({ activeKey: newActiveKey, focusKey: newActiveKey });
        onClickItem(item);
      };

      const toggleNode = item.hasNodes ? () => this.toggleNode(item.key) : undefined;
      return { ...item, focus, active, onClick, toggleNode };
    });
  };

  render() {
    const { children, hasSearch } = this.props;
    const { focusKey, activeKey, openNodes } = this.state;
    const items = this.generateItems();
    const renderedChildren = children || defaultChildren;
    const focusIndex = items.findIndex(item => item.key === (focusKey || activeKey));
    const getNodeToBeClosed = (
      menuItems: TreeMenuItem[],
      openNodes: string[],
      focusIndex: number
    ) => {
      const nodeArray = menuItems[focusIndex].key.split('/');
      const currentNode = menuItems[focusIndex].key;
      if (openNodes.includes(currentNode)) return currentNode;
      return nodeArray.length > 1
        ? nodeArray.slice(0, nodeArray.length - 1).join('/')
        : currentNode;
    };

    return (
      <div
        tabIndex={0}
        onKeyDown={e => {
          switch (e.key) {
            case 'ArrowUp': {
              this.setState(({ focusKey }) => ({
                focusKey: focusIndex > 0 ? items[focusIndex - 1].key : focusKey,
              }));
              break;
            }
            case 'ArrowDown': {
              this.setState(({ focusKey }) => ({
                focusKey:
                  focusIndex < items.length - 1 ? items[focusIndex + 1].key : focusKey,
              }));
              break;
            }
            case 'ArrowLeft': {
              this.setState(({ openNodes }) => {
                const nodeToBeClosed = getNodeToBeClosed(items, openNodes, focusIndex);
                const newOpenNodes = openNodes.filter(node => node !== nodeToBeClosed);

                return { openNodes: newOpenNodes, focusKey: nodeToBeClosed };
              });
              break;
            }
            case 'ArrowRight': {
              const { hasNodes, key } = items[focusIndex];
              if (hasNodes)
                this.setState(state => ({
                  openNodes: [...state.openNodes, key],
                }));
              break;
            }
          }
        }}
      >
        {renderedChildren(hasSearch ? { search: this.search, items } : { items })}
      </div>
    );
  }
}

export default TreeMenu;
