// / <reference path="../node_modules/litegraph.js/src/litegraph.d.ts" />
// @ts-ignore
import { app } from "../../scripts/app.js";
// @ts-ignore
import { ComfyWidgets } from "../../scripts/widgets.js";
import type {
  SerializedLGraphNode,
  LGraphNode as TLGraphNode,
  LiteGraph as TLiteGraph,
} from "./typings/litegraph.js";
import type { ComfyApp, ComfyObjectInfo } from "./typings/comfy.js";
import { addConnectionLayoutSupport, replaceNode } from "./utils.js";

declare const LiteGraph: typeof TLiteGraph;
declare const LGraphNode: typeof TLGraphNode;

let hasShownAlertForUpdatingInt = false;

app.registerExtension({
  name: "rgthree.DisplayAny",
  async beforeRegisterNodeDef(
    nodeType: typeof LGraphNode,
    nodeData: ComfyObjectInfo,
    app: ComfyApp,
  ) {
    if (nodeData.name === "Display Any (rgthree)") {
      (nodeType as any).title_mode = LiteGraph.NO_TITLE;

      const onNodeCreated = nodeType.prototype.onNodeCreated;
      nodeType.prototype.onNodeCreated = function () {
        onNodeCreated ? onNodeCreated.apply(this, []) : undefined;

        (this as any).showValueWidget = ComfyWidgets["STRING"](
          this,
          "output",
          ["STRING", { multiline: true }],
          app,
        ).widget;
        (this as any).showValueWidget.inputEl!.readOnly = true;
        (this as any).showValueWidget.serializeValue = async (
          node: SerializedLGraphNode,
          index: number,
        ) => {
          // Since we need a round trip to get the value, the serizalized value means nothing, and
          // saving it to the metadata would just be confusing. So, we clear it here.
          node.widgets_values![index] = "";
          return "";
        };
      };

      addConnectionLayoutSupport(nodeType, app, [["Left"], ["Right"]]);

      const onExecuted = nodeType.prototype.onExecuted;
      nodeType.prototype.onExecuted = function (message) {
        onExecuted?.apply(this, [message]);
        (this as any).showValueWidget.value = message.text[0];
      };
    }
  },

  // Port our DisplayInt to the Display Any, since they do the same thing now.
  async loadedGraphNode(node: TLGraphNode) {
    if (node.type === "Display Int (rgthree)") {
      replaceNode(node, "Display Any (rgthree)", new Map([["input", "source"]]));
      if (!hasShownAlertForUpdatingInt) {
        hasShownAlertForUpdatingInt = true;
        setTimeout(() => {
          alert(
            "Your Display Int nodes have been updated to Display Any nodes! " +
              "You can ignore the message underneath (for that node)." +
              "\n\nThanks.\n- rgthree",
          );
        }, 128);
      }
    }
  },
});