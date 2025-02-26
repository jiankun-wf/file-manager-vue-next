import { NButton, NIcon, NModal, NPopover, NSlider } from "naive-ui";
import { Fragment, nextTick, reactive, ref, toRefs, unref } from "vue";
import {
  ArrowLeftOutlined,
  SaveTwotone,
  ReloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  MinusOutlined,
  PlusOutlined,
  ColumnHeightOutlined,
  ColumnWidthOutlined,
  ExpandAltOutlined,
} from "@vicons/antd";
import {
  CropperCanvas,
  CropperImage,
  CropperShade,
  CropperSelection,
  CropperHandle,
  CropperGrid,
  CropperViewer,
} from "cropperjs";

CropperCanvas.$define();
CropperImage.$define();
CropperShade.$define();
CropperSelection.$define();
CropperHandle.$define();
CropperGrid.$define();
CropperViewer.$define();

import "@/lib/style/image-editor.less";
import { exportCavansImage, fileToBase64 } from "../utils/minetype";
import { uniqueId } from "lodash-es";
import { FileManagerSpirit } from "../types/namespace";

export const useImageEdit = () => {
  const showRef = ref(false);
  const currentFileRef = ref<FileManagerSpirit.FileItem>();

  const originSrc = ref("");
  const currentSrc = ref("");

  const originalTransform = ref<number[]>([]);

  const { rotateAngle, submitLoading } = toRefs(
    reactive({
      rotateAngle: 90,
      submitLoading: false,
    })
  );

  const $refs: Record<string, any> = {};

  const handleEditImage = async (file: FileManagerSpirit.FileItem) => {
    currentFileRef.value = file;
    if (!file.url) {
      const u = await fileToBase64(file.__FILE);
      originSrc.value = u;
      currentSrc.value = u;
    } else {
      originSrc.value = file.url;
      currentSrc.value = file.url;
    }
    showRef.value = true;
    nextTick(() => {
      resizeCropperImage();
    });
  };

  const resizeCropperImage = () => {
    const url = unref(originSrc);
    const img = new Image();
    img.onload = () => {
      const canvas = $refs["cropper-canvas"] as HTMLCanvasElement;

      // console.log($refs["cropper-image"].$getTransform());

      const maxWidth = canvas.clientWidth - 40;
      const maxHeight = canvas.clientHeight - 40;
      const iWidth = img.width;
      const iHeight = img.height;

      if (iWidth > maxWidth || iHeight > maxHeight) {
        let radioX = maxWidth / iWidth;
        let radioY = maxHeight / iHeight;
        if (radioX < radioY) {
          radioX = radioX > 1 ? 1 : radioX;
          radioY = radioY > 1 ? radioX : radioY;
        } else if (radioY < radioX) {
          radioY = radioY > 1 ? 1 : radioY;
          radioX = radioX > 1 ? radioY : radioX;
        } else {
          radioX = radioX > 1 ? 1 : radioX;
          radioY = radioY > 1 ? 1 : radioY;
        }

        const distanceX = maxWidth - iWidth;
        const distanceY = maxHeight - iHeight;

        $refs["cropper-image"].$setTransform(
          radioX,
          0,
          0,
          radioY,
          distanceX / 2 + 20,
          distanceY / 2 + 20
        );
        originalTransform.value = [
          radioX,
          0,
          0,
          radioY,
          distanceX / 2 + 20,
          distanceY / 2 + 20,
        ];
      } else {
        const distanceX = maxWidth - iWidth;
        const distanceY = maxHeight - iHeight;

        $refs["cropper-image"].$setTransform(
          1,
          0,
          0,
          1,
          distanceX / 2 + 20,
          distanceY / 2 + 20
        );

        originalTransform.value = [
          1,
          0,
          0,
          1,
          distanceX / 2 + 20,
          distanceY / 2 + 20,
        ];
      }
    };
    img.src = url;
  };

  const handleCloseModal = () => {
    showRef.value = false;
  };

  const handleSaveFile = async () => {
    try {
      submitLoading.value = true;
      const cavans: HTMLCanvasElement = await $refs[
        "cropper-selection"
      ].$toCanvas();

      const blob = await exportCavansImage(
        cavans,
        unref(currentFileRef)!.type,
        1
      );

      const file = new File([blob], `${unref(currentFileRef)!.name}.png`);

      unref(currentFileRef)!.__FILE = file;
      unref(currentFileRef)!.url = await fileToBase64(file);
      showRef.value = false;
    } finally {
      submitLoading.value = false;
    }
  };

  const renderImageEditorAction = () => {
    return (
      <div class="file-manager__image-editor-header-action">
        <NButton
          type="primary"
          onClick={handleSaveFile}
          loading={unref(submitLoading)}
        >
          {{
            icon: () => (
              <NIcon>
                <SaveTwotone />
              </NIcon>
            ),
            default: () => "保存",
          }}
        </NButton>
      </div>
    );
  };

  const rotateImage = (angle: number, type: "" | "-") => {
    $refs["cropper-image"].$rotate(`${type}${angle}deg`);
  };

  const scaleImage = (type: "-" | "+" | "reset") => {
    if (type === "reset") {
      $refs["cropper-image"].$setTransform(...unref(originalTransform));
    } else if (type === "+") {
      $refs["cropper-image"].$scale(1.1, 1.1);
    } else {
      $refs["cropper-image"].$scale(0.9, 0.9);
    }
  };

  const handleChangeScale = (type: "-" | "+" | "reset") => {
    const [x, _s, _h, y] = $refs["cropper-image"].$getTransform();

    if (x - 0.1 <= 0.05 || y - 0.1 <= 0.05) return;

    if (x + 0.1 >= 3 || y + 0.1 >= 3) return;
    scaleImage(type);
  };

  const filpImage = (type: "x" | "y" | "xy") => {
    if (type === "x") {
      $refs["cropper-image"].$scale(-1, 1);
    } else if (type === "y") {
      $refs["cropper-image"].$scale(1, -1);
    } else {
      $refs["cropper-image"].$scale(-1, -1);
    }
  };

  const renderImageSlider = () => {
    return (
      <Fragment>
        <div class="rorate-toolbar flex items-center mt-5">
          <NPopover>
            {{
              default: () => "逆时针旋转",
              trigger: () => (
                <div
                  class="cursor-pointer w-9 h-9 p-2 transition-property-colors leading-none duration-300 ease-in-out hover:bg-gray-200 rounded"
                  onClick={rotateImage.bind(null, unref(rotateAngle), "-")}
                >
                  <NIcon size={20}>
                    <RotateLeftOutlined />
                  </NIcon>
                </div>
              ),
            }}
          </NPopover>
          <div class="flex-1 mx-10px">
            <NSlider
              min={1}
              max={359}
              value={unref(rotateAngle)}
              onUpdate:value={(val) => {
                rotateAngle.value = val;
              }}
            />
          </div>

          <NPopover>
            {{
              default: () => "顺时针旋转",
              trigger: () => (
                <div
                  class="cursor-pointer w-9 h-9 p-2 transition-property-colors leading-none duration-300 ease-in-out hover:bg-gray-200 rounded"
                  onClick={rotateImage.bind(null, unref(rotateAngle), "")}
                >
                  <NIcon size={20}>
                    <RotateRightOutlined />
                  </NIcon>
                </div>
              ),
            }}
          </NPopover>
        </div>
        <div class="scale-toolbar flex items-center my-5 justify-between">
          <NPopover>
            {{
              default: () => "图像缩小",
              trigger: () => (
                <div
                  class="cursor-pointer w-9 h-9 p-2 transition-property-colors leading-none duration-300 ease-in-out hover:bg-gray-200 rounded"
                  onClick={handleChangeScale.bind(null, "-")}
                >
                  <NIcon size={20}>
                    <MinusOutlined />
                  </NIcon>
                </div>
              ),
            }}
          </NPopover>
          <NPopover>
            {{
              default: () => "图像重置",
              trigger: () => (
                <div
                  class="cursor-pointer w-9 h-9 p-2 transition-property-colors leading-none duration-300 ease-in-out hover:bg-gray-200 rounded"
                  onClick={handleChangeScale.bind(null, "reset")}
                >
                  <NIcon size={20}>
                    <ReloadOutlined />
                  </NIcon>
                </div>
              ),
            }}
          </NPopover>
          <NPopover>
            {{
              default: () => "图像放大",
              trigger: () => (
                <div
                  class="cursor-pointer w-9 h-9 p-2 transition-property-colors leading-none duration-300 ease-in-out hover:bg-gray-200 rounded"
                  onClick={handleChangeScale.bind(null, "+")}
                >
                  <NIcon size={20}>
                    <PlusOutlined />
                  </NIcon>
                </div>
              ),
            }}
          </NPopover>
        </div>
        <div class="flip-toolbar flex items-center my-5 justify-between">
          <NPopover>
            {{
              default: () => "图像水平反转",
              trigger: () => (
                <div
                  class="cursor-pointer w-9 h-9 p-2 transition-property-colors leading-none duration-300 ease-in-out hover:bg-gray-200 rounded"
                  onClick={filpImage.bind(null, "x")}
                >
                  <NIcon size={20}>
                    <ColumnWidthOutlined />
                  </NIcon>
                </div>
              ),
            }}
          </NPopover>
          <NPopover>
            {{
              default: () => "图像垂直反转",
              trigger: () => (
                <div
                  class="cursor-pointer w-9 h-9 p-2 transition-property-colors leading-none duration-300 ease-in-out hover:bg-gray-200 rounded"
                  onClick={filpImage.bind(null, "y")}
                >
                  <NIcon size={20}>
                    <ColumnHeightOutlined />
                  </NIcon>
                </div>
              ),
            }}
          </NPopover>
          <NPopover>
            {{
              default: () => "图像对角线反转",
              trigger: () => (
                <div
                  class="cursor-pointer w-9 h-9 p-2 transition-property-colors leading-none duration-300 ease-in-out hover:bg-gray-200 rounded"
                  onClick={filpImage.bind(null, "xy")}
                >
                  <NIcon size={20}>
                    <ExpandAltOutlined />
                  </NIcon>
                </div>
              ),
            }}
          </NPopover>
        </div>
      </Fragment>
    );
  };

  const createRef = (name: string, ref: any) => {
    $refs[name] = ref;
  };

  const renderCropperContext = () => {
    const renderSectionId = uniqueId("cropper-section-");
    return (
      <cropper-canvas
        background
        themeColor="#0025ff"
        ref={(_ref: any) => createRef("cropper-canvas", _ref)}
      >
        <cropper-image
          ref={(_ref: any) => createRef("cropper-image", _ref)}
          src={unref(currentSrc)}
          rotatable
          scalable
          skewable
          translatable
          class="transition-transform duration-150 ease-in-out"
        ></cropper-image>
        <cropper-handle
          action="select"
          plain
          ref={(_ref: any) => createRef("cropper-handle", _ref)}
        ></cropper-handle>
        <cropper-shade hidden></cropper-shade>
        <cropper-selection
          initial-coverage="0.4"
          id={renderSectionId}
          ref={(_ref: any) => createRef("cropper-selection", _ref)}
          movable
          resizable
          zoomable
        >
          <cropper-grid role="grid" rows="6" columns="6" covered></cropper-grid>
          <cropper-handle action="move" plain></cropper-handle>
          <cropper-handle action="n-resize" />
          <cropper-handle action="e-resize" />
          <cropper-handle action="s-resize" />
          <cropper-handle action="w-resize" />
          <cropper-handle action="ne-resize" />
          <cropper-handle action="nw-resize" />
          <cropper-handle action="se-resize" />
          <cropper-handle action="sw-resize" />
        </cropper-selection>
      </cropper-canvas>
    );
  };

  const renderImageEditModal = () => {
    return (
      <NModal
        show={unref(showRef)}
        to="body"
        maskClosable={false}
        showIcon={false}
        transformOrigin="center"
        class="file-manager__image-editor"
      >
        <div>
          <div class="file-manager__image-editor-header">
            <div
              class="file-manager__image-editor-header-back"
              onClick={handleCloseModal}
            >
              <NIcon size={20}>
                <ArrowLeftOutlined />
              </NIcon>
            </div>
            {renderImageEditorAction()}
          </div>
          <div class="file-manager__image-editor-body">
            <div class="file-manager__image-editor-body-slider py-2 px-3">
              {renderImageSlider()}
            </div>
            <div class="file-manager__image-editor-body-stage">
              {renderCropperContext()}
            </div>
          </div>
        </div>
      </NModal>
    );
  };

  return {
    render: renderImageEditModal,
    open: handleEditImage,
  };
};
