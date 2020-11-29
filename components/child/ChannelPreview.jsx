/*
 * Copyright (c) 2020 Cynthia/Bowser65
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
  getGuildId: () => 'owo'
};

// Classes
const { icon, iconWrapper } = getModule([ 'iconWrapper', 'transparent' ], false);
const { title, content: chatContent } = getModule([ 'title', 'content', 'chat' ], false);
const { size16 } = getModule([ 'size16' ], false);
const { base } = getModule([ 'base' ], false);

const Message = getModule(m => m.prototype && m.prototype.getReaction && m.prototype.isSystemDM, false);
const { getCurrentUser } = getModule([ 'getCurrentUser' ], false);

module.exports = React.memo(
  (props) => {
    // State
    const currentUser = getCurrentUser();
    const colorStaff = React.useMemo(() => `#${ROLE_COLORS[Math.round(Math.random() * 10)].toString(16)}`, []);
    const colorMod = React.useMemo(() => `#${ROLE_COLORS[Math.round(Math.random() * 10)].toString(16)}`, []);

    // @todo Add embeds & reactions to preview
    const conversation = React.useMemo((props) => [
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
      <div id='rich-quotes-preview'>
        <HeaderBarContainer>
          <div className={iconWrapper}>
            <ChannelText className={icon}/>
          </div>
          <h3 className={`${title} ${base} ${size16}`}>test-channel</h3>
        </HeaderBarContainer>
        <div className={chatContent}>
          <AdvancedScrollerAuto>
            <div className='group-spacing-16' ref={e => props.previewRef(e)}>
              {conversation.map((msg, i) => (<ChannelMessage
                key={`owo-${i.toString()}`}
                channel={channel}
                message={new Message({
                  id: i,
                  author: currentUser,
                  colorString: msg[0],
                  content: msg[1]
                })}
                id={`owo-${i.toString()}`}
                class={'richquotes-preview-message'}
                groupId={i}
              />))}
            </div>
          </AdvancedScrollerAuto>
        </div>
      </div>
    );
  }
);
