/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 * 
 * Edited by MulverineX
 */

const { React, getModule, getModuleByDisplayName, constants: { ROLE_COLORS } } = require('powercord/webpack');
const { AsyncComponent, AdvancedScrollerAuto } = require('powercord/components');

const HeaderBarContainer = AsyncComponent.from(getModuleByDisplayName('HeaderBarContainer'));
const ChannelText = AsyncComponent.from(getModuleByDisplayName('ChannelText'));
const ChannelMessage = getModule([ 'MESSAGE_ID_PREFIX' ], false).default;

const channel = {
  isPrivate: () => false,
  isSystemDM: () => false,
  getGuildId: () => 'uwu'
};

// Classes
const { icon, iconWrapper } = getModule([ 'iconWrapper', 'transparent' ], false);
const { title, content: chatContent } = getModule([ 'title', 'content', 'chat' ], false);
const { size16 } = getModule([ 'size16' ], false);
const { base } = getModule([ 'base' ], false);

const Message = getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM, false);
const { getCurrentUser } = getModule([ 'getCurrentUser' ], false);

module.exports = React.memo(
  () => {
    // State
    const currentUser = getCurrentUser();
    const colorStaff = React.useMemo(() => `#${ROLE_COLORS[Math.round(Math.random() * 10)].toString(16)}`, []);
    const colorMod = React.useMemo(() => `#${ROLE_COLORS[Math.round(Math.random() * 10)].toString(16)}`, []);

    const conversation = React.useMemo(() => [
      [ colorStaff, `Check out this preview` ],
      [ null, `We're previewing the sick new plugin? Heck yeah!` ],
      [ colorMod, `> We're previewing the sick new plugin? Heck yeah!\n<@!${currentUser.id}> Wait, you know about Rich Quotes ${currentUser.username}?` ],
      [ null, 'Indeed!' ],
      [ colorMod, 'But how?!' ],
      [ colorStaff, 'https://discord.com/channels/000000000000000000/000000000000000000/000000000000000000' ],
      [ colorMod, 'Oh, that explains it.' ]
    ], [ colorStaff, colorMod, currentUser ]);

    // Render
    return (
      <div className='total-members-preview'>
        <HeaderBarContainer>
          <div className={iconWrapper}>
            <ChannelText className={icon}/>
          </div>
          <h3 className={`${title} ${base} ${size16}`}>test-channel</h3>
        </HeaderBarContainer>
        <div className={chatContent}>
          <AdvancedScrollerAuto>
            <div className='group-spacing-16'>
              {conversation.map((msg, i) => (
                <ChannelMessage
                  key={`uwu-${i.toString()}`}
                  channel={channel}
                  message={new Message({
                    id: i,
                    author: currentUser,
                    colorString: msg[0],
                    content: msg[1]
                  })}
                  id={`uwu-${i.toString()}`}
                  groupId={i}
                />
              ))}
            </div>
          </AdvancedScrollerAuto>
        </div>
      </div>
    );
  }
);
