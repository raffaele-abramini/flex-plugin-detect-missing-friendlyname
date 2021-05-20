import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

const PLUGIN_NAME = 'DetectMissingFriendlynamePlugin';

export default class DetectMissingFriendlynamePlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    const MissingFriendlyName = {};

    class SpyComponent extends React.Component {
      shouldComponentUpdate(nextProps, nextState, nextContext) {
        // Re-render only if the members map changes (either bewtween conversations or new members are added)
        return nextProps.channel?.members !== this.props.channel?.members;
      }

      render() {
       try {
         const {channel} = this.props;

         // if there's not channel source, or there are not members or we already analyzed this channel, don't do anything
         if (!channel?.source ||!channel?.members?.size || MissingFriendlyName[channel?.source.sid]) {
           return <></>;
         }

         const membersWithoutFriendlyNames = Array.from(channel.members.values()).filter(m => !m.friendlyName);
         const usersFromStore = manager.store.getState().flex.chat.users;

         if (membersWithoutFriendlyNames.length) {
           MissingFriendlyName[channel.source.sid] = {
             channelMembers: membersWithoutFriendlyNames,
             chatUsers: membersWithoutFriendlyNames.map(m => usersFromStore[m.source.identity])
           }

           // Before 1.26
           flex.ErrorManager.createAndProcessError(`Detected channel users without a friendly name for ${channel.source.sid}`, {
             context: "Custom",
             description:`Detected channel users without a friendly name for ${channel.source.sid}.
Participant: ${membersWithoutFriendlyNames.map(m => `${m.source.identity} - ${m.source.sid}`).join(",")}
Member: ${membersWithoutFriendlyNames.map(m => `${usersFromStore[m.source.identity]?.identity} - ${usersFromStore[m.source.identity]?.descriptor?.sid}`).join(",")}
`
           })

           return <></>;
         }
       } catch(e) {}
      };
    }

    flex.MessagingCanvas.Content.add(<SpyComponent key="Spy" />);
  }
}
