export enum InteractionType {
	Like = 'like',
	Comment = 'comment',
	Follow = 'follow',
	Share = 'share',
	Save = 'save',
	View = 'view',
}

export enum CommentType {
	Text = 'text',
	Emoji = 'emoji',
	Mention = 'mention',
}

export enum ShareType {
	CopyLink = 'copy_link',
	ShareToStory = 'share_to_story',
	ShareToDM = 'share_to_dm',
	ShareToOther = 'share_to_other',
}
