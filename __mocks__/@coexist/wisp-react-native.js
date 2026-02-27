const React = require('react');
const { View, Text: RNText } = require('react-native');

const mockComponent = (name) => {
  const Component = React.forwardRef((props, ref) =>
    React.createElement(View, { ...props, ref, testID: props.testID || name }, props.children)
  );
  Component.displayName = name;
  return Component;
};

module.exports = {
  // Providers & hooks
  WispProvider: ({ children }) => React.createElement(View, { testID: 'WispProvider' }, children),
  useTheme: () => ({
    theme: {
      colors: {
        background: { canvas: '#fff', sunken: '#f5f5f5', raised: '#fafafa', surface: '#fff' },
        text: { primary: '#000', secondary: '#666', muted: '#999', inverse: '#fff', link: '#00f', onRaised: '#333' },
        border: { subtle: '#eee', strong: '#ccc', focus: '#00f' },
        accent: { primary: '#000', primaryHover: '#333' },
        status: { success: '#0f0', danger: '#f00' },
        brand: { surface: '#6366f1', text: '#fff' },
      },
      mode: 'light',
    },
    mode: 'light',
    toggleMode: jest.fn(),
    setOverrides: jest.fn(),
  }),

  // Primitives
  Text: ({ children, ...props }) => React.createElement(RNText, props, children),
  Avatar: mockComponent('Avatar'),
  AvatarGroup: mockComponent('AvatarGroup'),
  Toggle: mockComponent('Toggle'),
  Badge: mockComponent('Badge'),
  Input: mockComponent('Input'),
  TextArea: mockComponent('TextArea'),
  Select: mockComponent('Select'),
  Button: React.forwardRef((props, ref) => {
    const { Pressable } = require('react-native');
    return React.createElement(Pressable, {
      ...props,
      ref,
      testID: props.testID || 'Button',
      onPress: props.onPress,
      disabled: props.disabled,
    }, typeof props.children === 'string'
      ? React.createElement(RNText, {}, props.children)
      : props.children
    );
  }),
  Checkbox: mockComponent('Checkbox'),
  Spinner: mockComponent('Spinner'),
  PinInput: mockComponent('PinInput'),

  // Layouts
  HStack: ({ children, ...props }) => React.createElement(View, { ...props, testID: 'HStack' }, children),
  VStack: ({ children, ...props }) => React.createElement(View, { ...props, testID: 'VStack' }, children),
  Sidebar: mockComponent('Sidebar'),
  SidebarSection: mockComponent('SidebarSection'),
  AnchoredPopover: mockComponent('AnchoredPopover'),

  // Containers / Feedback
  Card: mockComponent('Card'),
  Alert: mockComponent('Alert'),
  Overlay: ({ children, open }) => open ? React.createElement(View, { testID: 'Overlay' }, children) : null,
  Dialog: (() => {
    const Comp = React.forwardRef((props, ref) => {
      if (!props.open) return null;
      return React.createElement(View, { ref, testID: props.testID || 'Dialog' },
        props.children,
        props.footer
      );
    });
    Comp.displayName = 'Dialog';
    return Comp;
  })(),
  Presence: ({ children, visible }) => visible !== false ? React.createElement(View, { testID: 'Presence' }, children) : null,
  Separator: mockComponent('Separator'),
  QRCode: mockComponent('QRCode'),
  ColorPicker: mockComponent('ColorPicker'),

  // Tabs
  Tabs: ({ children, ...props }) => React.createElement(View, { ...props, testID: 'Tabs' }, children),
  TabList: ({ children, ...props }) => React.createElement(View, { ...props, testID: 'TabList' }, children),
  Tab: ({ children, ...props }) => React.createElement(View, { ...props, testID: 'Tab' }, children),
  TabPanel: ({ children, ...props }) => React.createElement(View, { ...props, testID: 'TabPanel' }, children),

  // Friends
  FriendListItem: mockComponent('FriendListItem'),
  FriendRequestItem: mockComponent('FriendRequestItem'),
  FriendSection: mockComponent('FriendSection'),
  AddFriendInput: mockComponent('AddFriendInput'),

  // Chat
  ChatBubble: (() => {
    const Component = React.forwardRef(({ children, media, ...props }, ref) =>
      React.createElement(View, { ...props, ref, testID: props.testID || 'ChatBubble' }, media, children)
    );
    Component.displayName = 'ChatBubble';
    return Component;
  })(),
  StatusIcon: mockComponent('StatusIcon'),
  MessageGroup: mockComponent('MessageGroup'),
  NewMessageDivider: mockComponent('NewMessageDivider'),
  TypingIndicator: mockComponent('TypingIndicator'),
  AudioWaveform: mockComponent('AudioWaveform'),
  LinkPreviewCard: mockComponent('LinkPreviewCard'),
  MessageActionBar: mockComponent('MessageActionBar'),
  MessageInput: mockComponent('MessageInput'),
  MessageSearch: mockComponent('MessageSearch'),
  EmojiPicker: mockComponent('EmojiPicker'),
  SearchInput: mockComponent('SearchInput'),
  ConversationListItem: mockComponent('ConversationListItem'),
  MemberList: mockComponent('MemberList'),
  PinnedMessages: mockComponent('PinnedMessages'),
  UserProfileCard: mockComponent('UserProfileCard'),
  Navbar: mockComponent('Navbar'),
  NavbarBrand: mockComponent('NavbarBrand'),
  NavbarContent: mockComponent('NavbarContent'),

  // Dropdown menu
  DropdownMenu: mockComponent('DropdownMenu'),
  DropdownMenuTrigger: mockComponent('DropdownMenuTrigger'),
  DropdownMenuContent: mockComponent('DropdownMenuContent'),
  DropdownMenuItem: mockComponent('DropdownMenuItem'),
  DropdownMenuSeparator: mockComponent('DropdownMenuSeparator'),

  // Tooltip
  Tooltip: ({ children }) => React.createElement(View, { testID: 'Tooltip' }, children),

  // Extras
  NavbarItem: mockComponent('NavbarItem'),
  ThreadPanel: mockComponent('ThreadPanel'),
  MentionAutocomplete: mockComponent('MentionAutocomplete'),
  CombinedPicker: mockComponent('CombinedPicker'),

  // Form controls
  Tag: mockComponent('Tag'),
  Slider: mockComponent('Slider'),
  SegmentedControl: mockComponent('SegmentedControl'),

  // Call components
  CallNotification: mockComponent('CallNotification'),
  CallTimer: mockComponent('CallTimer'),
  CallControls: mockComponent('CallControls'),

  // Deep-import component mocks (re-exported here for moduleNameMapper)
  MessageActionBar: mockComponent('MessageActionBar'),
  UserProfileCard: mockComponent('UserProfileCard'),
};
