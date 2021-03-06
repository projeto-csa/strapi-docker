'use strict';

/**
 * Csa.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');

module.exports = {

  /**
   * Promise to fetch all csas.
   *
   * @return {Promise}
   */

  fetchAll: (params) => {
    // Convert `params` object to filters compatible with Mongo.
    const filters = strapi.utils.models.convertParams('csa', params);
    // Select field to populate.
    const populate = Csa.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias)
      .join(' ');

    return Csa
      .find()
      .where(filters.where)
      .sort(filters.sort)
      .skip(filters.start)
      .limit(filters.limit)
      .populate(filters.populate || populate);
  },

  /**
   * Promise to fetch a/an csa.
   *
   * @return {Promise}
   */

  fetch: (params) => {
    // Select field to populate.
    const populate = Csa.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias)
      .join(' ');

    return Csa
      .findOne(_.pick(params, _.keys(Csa.schema.paths)))
      .populate(populate)
      .populate({
        path: 'variations',
        populate: {path: 'routine'}
      });
  },

  /**
   * Promise to count csas.
   *
   * @return {Promise}
   */

  count: (params) => {
    // Convert `params` object to filters compatible with Mongo.
    const filters = strapi.utils.models.convertParams('csa', params);

    return Csa
      .countDocuments()
      .where(filters.where);
  },

  /**
   * Promise to add a/an csa.
   *
   * @return {Promise}
   */

  add: async (values) => {
    // Extract values related to relational data.
    const relations = _.pick(values, Csa.associations.map(ast => ast.alias));
    const data = _.omit(values, Csa.associations.map(ast => ast.alias));

    // Create entry with no-relational data.
    const entry = await Csa.create(data);

    // Create relational data and return the entry.
    return Csa.updateRelations({ _id: entry.id, values: relations });
  },

  /**
   * Promise to edit a/an csa.
   *
   * @return {Promise}
   */

  edit: async (params, values) => {
    //params contains id, values contains payload

    // Extract values related to relational data.
    // relational only { field1: relation|[relation1, ...], field2: relation|[relation1, ...], ...}
    const relations = _.pick(values, Csa.associations.map(a => a.alias));
    // non relational only { field1: value1, field1: value2, ... }
    const data = _.omit(values, Csa.associations.map(a => a.alias));

    // Update entry with no-relational data.
    // entry contains operation result log. (metainformation)
    const entry = await Csa.updateOne(params, data, { multi: true });

    // Update relational data and return the entry.
    // returns a promise to entry
    // Object.assign(params, { values: relations }) creates:
    // { _id: 231.., values: {...}}
    const response = await Csa.updateRelations(Object.assign(params, { values: relations }))

    // Duplicated code from fetch.
    // return previously was:
    //  return Csa.updateRelations(Object.assign(params, { values: relations }))
    // Couldn't populate values from Csa.updateRelations()
    // work-around: await updateRelations to query value
    // Select field to populate.
    const populate = Csa.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias)
      .join(' ');

    return Csa
      .findOne(_.pick(params, _.keys(Csa.schema.paths)))
      .populate(populate)
      .populate({
        path: 'variations',
        populate: {path: 'routine'}
      });
  },

  /**
   * Promise to remove a/an csa.
   *
   * @return {Promise}
   */

  remove: async params => {
    // Select field to populate.
    const populate = Csa.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias)
      .join(' ');

    // Note: To get the full response of Mongo, use the `remove()` method
    // or add spent the parameter `{ passRawResult: true }` as second argument.
    const data = await Csa
      .findOneAndRemove(params, {})
      .populate(populate);

    if (!data) {
      return data;
    }

    await Promise.all(
      Csa.associations.map(async association => {
        if (!association.via || !data._id) {
          return true;
        }

        const search = _.endsWith(association.nature, 'One') || association.nature === 'oneToMany' ? { [association.via]: data._id } : { [association.via]: { $in: [data._id] } };
        const update = _.endsWith(association.nature, 'One') || association.nature === 'oneToMany' ? { [association.via]: null } : { $pull: { [association.via]: data._id } };

        // Retrieve model.
        const model = association.plugin ?
          strapi.plugins[association.plugin].models[association.model || association.collection] :
          strapi.models[association.model || association.collection];

        return model.update(search, update, { multi: true });
      })
    );

    return data;
  },

  /**
   * Promise to search a/an csa.
   *
   * @return {Promise}
   */

  search: async (params) => {
    // Convert `params` object to filters compatible with Mongo.
    const filters = strapi.utils.models.convertParams('csa', params);
    // Select field to populate.
    const populate = Csa.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias)
      .join(' ');

    const $or = Object.keys(Csa.attributes).reduce((acc, curr) => {
      switch (Csa.attributes[curr].type) {
        case 'integer':
        case 'float':
        case 'decimal':
          if (!_.isNaN(_.toNumber(params._q))) {
            return acc.concat({ [curr]: params._q });
          }

          return acc;
        case 'string':
        case 'text':
        case 'password':
          return acc.concat({ [curr]: { $regex: params._q, $options: 'i' } });
        case 'boolean':
          if (params._q === 'true' || params._q === 'false') {
            return acc.concat({ [curr]: params._q === 'true' });
          }

          return acc;
        default:
          return acc;
      }
    }, []);

    return Csa
      .find({ $or })
      .sort(filters.sort)
      .skip(filters.start)
      .limit(filters.limit)
      .populate(populate);
  }
};
