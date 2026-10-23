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

    // Spacing: recent WordPress drops the controls' bottom margin
    // (__nextHasNoMarginBottom), so every gap here is set explicitly. Each
    // toggle sits in its own PanelRow, the core pattern for document-panel
    // toggles, and the FAQ rows stack in flex columns with a gap.
    var stack = function (gap, extra) {
      var style = { display: 'flex', flexDirection: 'column', gap: gap };
      return Object.assign(style, extra || {});
    };

    var rows = faq.map(function (row, index) {
      return el('div', { key: 'faq-' + index, className: 'nurevo-faq-row', style: stack('8px', { paddingBottom: '16px', borderBottom: '1px solid #e0e0e0' }) },
        el(c.TextControl, {
          __nextHasNoMarginBottom: true,
          __next40pxDefaultSize: true,
          label: t.question,
          value: row.q || '',
          onChange: function (value) { updateRow(index, 'q', value); }
        }),
        el(c.TextareaControl, {
          __nextHasNoMarginBottom: true,
          label: t.answer,
          value: row.a || '',
          onChange: function (value) { updateRow(index, 'a', value); }
        }),
        el('div', null,
          el(c.Button, {
            isDestructive: true,
            variant: 'link',
            onClick: function () {
              setFaq(faq.filter(function (unused, i) { return i !== index; }));
            }
          }, t.remove)
        )
      );
    });

    var Row = c.PanelRow || 'div';

    return el(Panel, { name: 'nurevo-aeo-post-settings', title: t.title, className: 'nurevo-aeo-post-settings' },
      el(Row, null,
        el(c.ToggleControl, {
          __nextHasNoMarginBottom: true,
          label: t.excludeLlms,
          checked: !!meta._nurevo_exclude_llms,
          onChange: function (value) { setMeta('_nurevo_exclude_llms', !!value); }
        })
      ),
      el(Row, null,
        el(c.ToggleControl, {
          __nextHasNoMarginBottom: true,
          label: t.excludeSchema,
          checked: !!meta._nurevo_exclude_schema,
          onChange: function (value) { setMeta('_nurevo_exclude_schema', !!value); }
        })
      ),
      el('div', { style: stack('16px', { marginTop: '24px' }) },
        el('div', null,
          el('p', { style: { fontWeight: 600, margin: '0 0 8px' } }, t.faqHeading),
          el('p', { className: 'description', style: { margin: 0 } }, t.faqHelp)
        ),
        rows,
        el('div', null,
          el(c.Button, {
            variant: 'secondary',
            __next40pxDefaultSize: true,
            onClick: function () { setFaq(faq.concat([{ q: '', a: '' }])); }
          }, t.add)
        )
      )
    );
  }

  wp.plugins.registerPlugin('nurevo-aeo-post-settings', { render: NurevoPostSettings, icon: null });
}(window.wp, window.nurevoEditorPanel));
