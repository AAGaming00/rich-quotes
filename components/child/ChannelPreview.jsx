/*
 * Copyright (c) 2020 Cynthia K. Rey, All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 *
 * Edited by MulverineX & AAGaming
 */

const { React, getModule, getModuleByDisplayName, constants: { ROLE_COLORS } } = require('powercord/webpack');
const { AsyncComponent, AdvancedScrollerAuto } = require('powercord/components');

const HeaderBarContainer = AsyncComponent.from(getModuleByDisplayName('HeaderBarContainer'));
const ChannelText = AsyncComponent.from(getModuleByDisplayName('ChannelText'));
const ChannelMessage = getModule([ 'getElementFromMessageId' ], false).default;

const channel = {
  isPrivate: () => false,
  isSystemDM: () => false,
  getGuildId: () => 'owo',
  isArchivedThread: () => {}
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
            <div className='group-spacing-16' ref={e => setTimeout(() => e?.parentNode?.scrollTo({top: e?.childNodes[6].offsetHeight + e?.childNodes[6].getBoundingClientRect().height}), 1)}>
              {conversation.map((msg, i) => (<ChannelMessage
                key={`owo-${i.toString()}-${props.reload}`}
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
