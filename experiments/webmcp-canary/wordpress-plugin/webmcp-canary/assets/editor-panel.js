/**
 * Nurevo AEO: per-post settings in the block editor sidebar.
 *
 * Plain JavaScript with wp.element.createElement, so there is no build step.
 * Edits three post meta keys registered by the plugin (show_in_rest, edit_post
 * auth): _nurevo_exclude_llms, _nurevo_exclude_schema and _nurevo_faq. The
 * strings arrive translated from PHP in window.nurevoEditorPanel.
 */
(function (wp, config) {
  'use strict';
  if (!wp || !wp.plugins || !wp.element || !wp.data || !wp.components) {
    return;
  }
  var Panel = (wp.editor && wp.editor.PluginDocumentSettingPanel)
    || (wp.editPost && wp.editPost.PluginDocumentSettingPanel);
  if (!Panel || !wp.data.useSelect || !wp.data.useDispatch) {
    return;
  }
  var el = wp.element.createElement;
  var c = wp.components;
  var t = (config && config.i18n) || {};

  function NurevoPostSettings() {
    var meta = wp.data.useSelect(function (select) {
      return select('core/editor').getEditedPostAttribute('meta') || {};
    }, []);
    var editPost = wp.data.useDispatch('core/editor').editPost;

    // Meta is only editable where the post type supports custom fields.
    if (!Object.prototype.hasOwnProperty.call(meta, '_nurevo_exclude_llms')) {
      return null;
    }

    function setMeta(key, value) {
      var patch = {};
      patch[key] = value;
      editPost({ meta: patch });
    }

    var faq = Array.isArray(meta._nurevo_faq) ? meta._nurevo_faq : [];
    function setFaq(rows) {
      setMeta('_nurevo_faq', rows);
    }
    function updateRow(index, field, value) {
      var rows = faq.map(function (row) {
        return { q: row.q || '', a: row.a || '' };
      });
      rows[index][field] = value;
      setFaq(rows);
    }

    var rows = faq.map(function (row, index) {
      return el('div', { key: 'faq-' + index, className: 'nurevo-faq-row', style: { marginBottom: '12px' } },
        el(c.TextControl, {
          label: t.question,
          value: row.q || '',
          onChange: function (value) { updateRow(index, 'q', value); }
        }),
        el(c.TextareaControl, {
          label: t.answer,
          value: row.a || '',
          onChange: function (value) { updateRow(index, 'a', value); }
        }),
        el(c.Button, {
          isDestructive: true,
          variant: 'link',
          onClick: function () {
            setFaq(faq.filter(function (unused, i) { return i !== index; }));
          }
        }, t.remove)
      );
    });

    return el(Panel, { name: 'nurevo-aeo-post-settings', title: t.title, className: 'nurevo-aeo-post-settings' },
      el(c.ToggleControl, {
        label: t.excludeLlms,
        checked: !!meta._nurevo_exclude_llms,
        onChange: function (value) { setMeta('_nurevo_exclude_llms', !!value); }
      }),
      el(c.ToggleControl, {
        label: t.excludeSchema,
        checked: !!meta._nurevo_exclude_schema,
        onChange: function (value) { setMeta('_nurevo_exclude_schema', !!value); }
      }),
      el('p', { style: { fontWeight: 600, marginTop: '16px' } }, t.faqHeading),
      el('p', { className: 'description' }, t.faqHelp),
      rows,
      el(c.Button, {
        variant: 'secondary',
        onClick: function () { setFaq(faq.concat([{ q: '', a: '' }])); }
      }, t.add)
    );
  }

  wp.plugins.registerPlugin('nurevo-aeo-post-settings', { render: NurevoPostSettings, icon: null });
}(window.wp, window.nurevoEditorPanel));
