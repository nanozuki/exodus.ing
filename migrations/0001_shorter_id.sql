UPDATE `user` SET id = SUBSTR(id, 1, 6);
UPDATE `article` SET id = SUBSTR(id, 1, 6), user_id = SUBSTR(user_id, 1, 6);
UPDATE `session` SET user_id = SUBSTR(user_id, 1, 6);
