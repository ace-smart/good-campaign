import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { initialize } from 'redux-form';
import CreateCampaignForm from '../../components/campaigns/CreateCampaignForm';
import PreviewCampaignForm from '../../components/campaigns/PreviewCampaignForm';
import { postCreateCampaign, getTemplates } from '../../actions/campaignActions';
import { notify } from '../../actions/notificationActions';
import { getLists } from '../../actions/listActions';
import FontAwesome from 'react-fontawesome';
import moment from 'moment';

function mapStateToProps(state) {
  // State reducer @ state.form & state.createCampaign & state.manageLists
  return {
    form: state.form.createCampaign,
    isPosting: state.createCampaign.isPosting,
    lists: state.manageList.lists,
    isGetting: state.manageList.isGetting,
    templates: state.manageTemplates.templates
  };
}

@connect(mapStateToProps, { postCreateCampaign, getLists, getTemplates, initialize, notify })
export default class CreateCampaign extends Component {

  static propTypes = {
    form: PropTypes.object,
    isPosting: PropTypes.bool.isRequired,
    postCreateCampaign: PropTypes.func.isRequired,
    getLists: PropTypes.func.isRequired,
    lists: PropTypes.array.isRequired,
    isGetting: PropTypes.bool.isRequired,
    getTemplates: PropTypes.func.isRequired,
    templates: PropTypes.array.isRequired,
    initialize: PropTypes.func.isRequired,
    notify: PropTypes.func.isRequired
  }

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor() {
    super();
    this.handleSubmit = this.handleSubmit.bind(this);
    this.nextPage = this.nextPage.bind(this);
    this.lastPage = this.lastPage.bind(this);
    this.applyTemplate = this.applyTemplate.bind(this);
    this.passResetToState = this.passResetToState.bind(this);
    this.clearTextEditor = this.clearTextEditor.bind(this);
  }

  state = {
    page: 1,
    initialFormValues: {
      campaignName: `Campaign - ${moment().format('l, h:mm:ss')}`,
      editorValue: '',
      type: 'Plaintext'
    },
    textEditorValue: null, // We should only change this if we want to change the text editor's value
    reset: null
  }

  componentDidMount() {
    this.props.getLists();
    this.props.getTemplates();

    if (this.props.form && this.props.form.values.emailBody) {
      this.setState({ // eslint-disable-line
        textEditorValue: this.props.form.values.emailBody
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isPosting === true && nextProps.isPosting === false) { // Fires when campaign has been successfully created
      this.context.router.push(`/campaigns/manage`);
    }
  }

  handleSubmit() {
    this.props.postCreateCampaign(JSON.stringify(this.props.form.values), this.state.reset);
    this.props.notify({
      message: 'Campaign is being created - it will be ready to send soon.',
      colour: 'green'
    });
  }

  applyTemplate(template) {
    if (template) {
      const applyTemplateOnTopOfCurrentValues = Object.assign({}, this.props.form.values, template);
      this.props.initialize('createCampaign', applyTemplateOnTopOfCurrentValues);
      this.setState({
        textEditorValue: template.emailBody
      });
    } else {
      this.props.notify({ message: 'You have not selected a valid template' });
    }
  }

  clearTextEditor() {
    this.state.editor.loadHTML('');
  }

  nextPage() {
    this.setState({ page: this.state.page + 1 });
  }

  lastPage() {
    this.setState({ page: this.state.page - 1 });
  }

  passResetToState(reset) {
    this.setState({ reset });
  }

  render() {
    const { page, initialFormValues, textEditorValue } = this.state;
    const { lists, templates, form, isGetting, isPosting } = this.props;

    const type = (this.props.form && this.props.form.values.type) ? this.props.form.values.type : this.state.initialFormValues.type;

    return (
      <div>
        <div className="content-header">
          <h1>Create Campaign
            <small>Create and optionally send to a new campaign</small>
          </h1>
        </div>

        <section className="content">
          <div className="box box-primary">
            <div className="box-body">
              {page === 1 && <CreateCampaignForm textEditorValue={textEditorValue} clearTextEditor={this.clearTextEditor} passResetToState={this.passResetToState} textEditorType={type} applyTemplate={this.applyTemplate} templates={templates} lists={lists} nextPage={this.nextPage} initialValues={initialFormValues} />}
              {page === 2 && <PreviewCampaignForm form={form} lastPage={this.lastPage} handleSubmit={this.handleSubmit} />}
            </div>

            {isGetting || isPosting && <div className="overlay">
              <FontAwesome name="refresh" spin/>
            </div>}
          </div>
        </section>

      </div>
    );
  }
}
