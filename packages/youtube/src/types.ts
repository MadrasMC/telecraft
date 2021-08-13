type Datetime = string;

export type LiveChatMessage = {
	kind: "youtube#liveChatMessage";
	id: string;
	snippet: {
		type: string;
		liveChatId: string;
		authorChannelId: string;
		publishedAt: Datetime;
		hasDisplayContent: boolean;
		displayMessage: string;
		fanFundingEventDetails: {
			amountMicros: number;
			currency: string;
			amountDisplayString: string;
			userComment: string;
		};
		textMessageDetails: {
			messageText: string;
		};
		messageDeletedDetails: {
			deletedMessageId: string;
		};
		userBannedDetails: {
			bannedUserDetails: {
				channelId: string;
				channelUrl: string;
				displayName: string;
				profileImageUrl: string;
			};
			banType: string;
			banDurationSeconds: number;
		};
		superChatDetails: {
			amountMicros: number;
			currency: string;
			amountDisplayString: string;
			userComment: string;
			tier: number;
		};
		superStickerDetails: {
			superStickerMetadata: {
				stickerId: string;
				altText: string;
				language: string;
			};
			amountMicros: number;
			currency: string;
			amountDisplayString: string;
			tier: number;
		};
	};
	authorDetails: {
		channelId: string;
		channelUrl: string;
		displayName: string;
		profileImageUrl: string;
		isVerified: boolean;
		isChatOwner: boolean;
		isChatSponsor: boolean;
		isChatModerator: boolean;
	};
};
