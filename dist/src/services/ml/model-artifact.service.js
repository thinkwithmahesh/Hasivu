"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelArtifactService = exports.DeploymentTarget = exports.ExportFormat = void 0;
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["TENSORFLOW_SAVED_MODEL"] = "tensorflow_saved_model";
    ExportFormat["TENSORFLOW_LITE"] = "tensorflow_lite";
    ExportFormat["ONNX"] = "onnx";
    ExportFormat["TENSORFLOWJS"] = "tensorflowjs";
    ExportFormat["PICKLE"] = "pickle";
    ExportFormat["JOBLIB"] = "joblib";
})(ExportFormat || (exports.ExportFormat = ExportFormat = {}));
var DeploymentTarget;
(function (DeploymentTarget) {
    DeploymentTarget["PRODUCTION"] = "production";
    DeploymentTarget["STAGING"] = "staging";
    DeploymentTarget["DEVELOPMENT"] = "development";
    DeploymentTarget["EDGE_DEVICE"] = "edge";
    DeploymentTarget["MOBILE"] = "mobile";
    DeploymentTarget["WEB_BROWSER"] = "browser";
})(DeploymentTarget || (exports.DeploymentTarget = DeploymentTarget = {}));
class ModelArtifactService {
    static instance;
    constructor() {
    }
    static getInstance() {
        if (!ModelArtifactService.instance) {
            ModelArtifactService.instance = new ModelArtifactService();
        }
        return ModelArtifactService.instance;
    }
    async saveModel(modelId, model, config, metrics, options = {}) {
        return `/models/${modelId}/latest`;
    }
    async loadModel(_modelId, _version, _target) {
        return null;
    }
    async getModelPath(_modelId, _version) {
        return `/models/${_modelId}/${_version || 'latest'}`;
    }
    async listModelVersions(_modelId) {
        return [];
    }
    async exportModel(modelId, version, format, target, options = {}) {
        return `/exports/${modelId}/${version}/${format}`;
    }
    async deleteModel(modelId, version) {
    }
    async getArtifactStats(modelId) {
        return {
            artifacts: {
                total: 0,
                unique_models: 0,
                total_size_bytes: 0,
                avg_size_bytes: 0,
                total_downloads: 0
            },
            storage: {},
            cache: {
                cached_models: 0,
                cached_metadata: 0
            }
        };
    }
}
exports.ModelArtifactService = ModelArtifactService;
//# sourceMappingURL=model-artifact.service.js.map