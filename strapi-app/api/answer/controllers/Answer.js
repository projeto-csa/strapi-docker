'use strict';

const sendMail = require('../../../helpers/sendMail');

/**
 * Answer.js controller
 *
 * @description: A set of functions called "actions" for managing `Answer`.
 */

module.exports = {

  /**
   * Retrieve answer records.
   *
   * @return {Object|Array}
   */

  find: async (ctx) => {
    if (ctx.query._q) {
      return strapi.services.answer.search(ctx.query);
    } else {
      return strapi.services.answer.fetchAll(ctx.query);
    }
  },

  /**
   * Retrieve a answer record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    if (!ctx.params._id.match(/^[0-9a-fA-F]{24}$/)) {
      return ctx.notFound();
    }

    return strapi.services.answer.fetch(ctx.params);
  },

  /**
   * Count answer records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.answer.count(ctx.query);
  },

  /**
   * Create a/an answer record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    const result = await strapi.services.answer.add(ctx.request.body);
    
    // send email to creator and interested users
    
    // const user = await strapi
    //   .plugins['users-permissions']
    //   .services
    //   .user
    //   .fetch(result.topic.creator);
    
    const topic = await strapi.services.topic.fetch(result.topic);
    const creatorEmail = topic.creator.email;
    
    sendMail({
      to: creatorEmail,
      subject: 'Nova resposta ao seu tópico',
      text: 'Alguém respondeu a um tópico que você criou!'
    });

    const interestedEmails = topic.interestedUsers.map(function (user) {
      return user.email;
    });

    sendMail({
      to: interestedEmails,
      subject: 'Nova resposta a um tópico de interesse',
      text: 'Álguém respondeu a um tópico no qual você está interessado!'
    });

    return result;
  },

  /**
   * Update a/an answer record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.answer.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an answer record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.answer.remove(ctx.params);
  }
};
