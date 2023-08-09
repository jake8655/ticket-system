import { envsafe, str, url } from 'envsafe';

export const env = envsafe({
  TOKEN: str(),
  CLIENT_ID: str(),
  GUILD_ID: str(),
  GUILD_ICON: url(),
  CHANNEL_ID: str(),
  MESSAGE_ID: str({
    allowEmpty: true,
  }),
  THUMBNAIL_ICON: url(),
  CATEGORY_ID: str(),
  ADMIN_ID: str(),
});
