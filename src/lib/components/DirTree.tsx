import { NEmpty, NIcon } from "naive-ui";
import {
  computed,
  defineComponent,
  inject,
  onMounted,
  onUnmounted,
  PropType,
  provide,
  ref,
  unref,
  watch,
} from "vue";
import { CaretRightOutlined } from "@vicons/antd";

import "../style/dir-tree.less";
import { DirIcon } from "./dirIcon";
import {
  eventPreventDefault,
  eventStop,
  eventStopPropagation,
} from "../utils/event";
import { FileDirItem, FileDirTreeContext } from "../types";
import { useDirRename } from "../hooks/useDirRename";
import { eventBus } from "../utils/pub-sub";
import { NK } from "../enum";
import { useContext } from "../utils/context";
import { useDragInToggle } from "../hooks/useDragToggle";

export const DirTree = defineComponent({
  name: "DirTree",
  props: {
    data: {
      type: Array as PropType<Record<string, any>[]>,
      default: () => [],
    },
    value: {
      type: String as PropType<string>,
      default: () => [],
    },
    expandKeys: {
      type: Array as PropType<string[]>,
      default: "",
    },
    childrenKey: {
      type: String as PropType<string>,
      default: "children",
    },
    labelKey: {
      type: String as PropType<string>,
      default: "name",
    },
    valueKey: {
      type: String as PropType<string>,
      default: "path",
    },
  },
  emits: ["update:value", "contextmenu", "update:expandKeys"],
  setup(props, { emit }) {
    const expandKeys = ref<string[]>(props.expandKeys);

    const currentValue = ref(props.value);

    provide<FileDirTreeContext>("treeContext", {
      expandKeys,
      configKey: {
        value: props.valueKey,
        label: props.labelKey,
        children: props.childrenKey,
      },
      emit,
      currentValue,
    });

    watch(
      () => props.value,
      (val) => {
        currentValue.value = val;
      }
    );

    watch(
      () => props.expandKeys,
      (val) => {
        expandKeys.value = val;
      }
    );

    return () => (
      <div class="file-manager-dir__tree">
        {props.data.length ? (
          <>
            {props.data.map((d) => (
              <DirTreeItem data={d} />
            ))}
          </>
        ) : (
          <NEmpty description="暂无文件夹" />
        )}
      </div>
    );
  },
});

export const DirTreeItem = defineComponent({
  name: "DirTreeItem",
  props: {
    data: {
      type: Object as PropType<Record<string, any>>,
      required: true,
    },
    parent: {
      type: Object as PropType<Record<string, any>>,
    },
    parentList: {
      type: Array as PropType<Record<string, any>[]>,
      default: undefined,
    },
    indent: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
  },
  setup(props) {
    const { currentValue, configKey, expandKeys, emit } =
      inject<FileDirTreeContext>("treeContext")!;

    const elementRef = ref<HTMLDivElement>();

    const { dirList } = useContext();

    const { value, label, children } = configKey;

    const dirPath = computed(() => {
      return props.data[value];
    });

    const { renderDirRenameInput, handleRename, naming } = useDirRename(
      props.data as FileDirItem,
      props.parentList ?? dirList,
      props.parent
    );

    const { isDragIn } = useDragInToggle({
      elementRef,
    });

    const getIsActive = computed(() => {
      return props.data[value] === unref(currentValue);
    });

    const getIsExpand = computed(() => {
      return expandKeys.value.includes(props.data[value]);
    });

    const handleExpandToggle = (e: MouseEvent) => {
      eventStop(e);
      const k = props.data[value];
      if (unref(getIsExpand)) {
        expandKeys.value = expandKeys.value.filter((v: string) => v !== k);
      } else {
        expandKeys.value.push(k);
      }
      emit("update:expandKeys", unref(expandKeys));
    };

    const handleTreeItemClick = (e: MouseEvent) => {
      eventStop(e);
      if (unref(naming) || props.data.__new) {
        return;
      }
      if (unref(getIsActive)) {
        return;
      }
      currentValue.value = props.data[value];
      emit("update:value", props.data[value]);
    };

    const onContextMenu = (event: MouseEvent) => {
      eventStop(event);
      emit(
        "contextmenu",
        event,
        props.data,
        props.parentList ?? dirList,
        props.parent
      );
    };

    const handleFileDrop = (e: DragEvent) => {
      eventStop(e);
    };

    onMounted(() => {
      eventBus.$listen(NK.DIR_RENAME_EVENT, {
        id: `dir_path_${unref(dirPath)}`,
        handler: handleRename,
      });
    });

    onUnmounted(() => {
      eventBus.$unListen(NK.DIR_RENAME_EVENT, `dir_path_${unref(dirPath)}`);
    });

    watch(dirPath, (old, val) => {
      if (old !== val) {
        eventBus.$unListen(NK.DIR_RENAME_EVENT, `dir_path_${old}`);
        eventBus.$listen(NK.DIR_RENAME_EVENT, {
          id: `dir_path_${val}`,
          handler: handleRename,
        });
      }
    });

    return () => (
      <>
        <div
          onClick={handleTreeItemClick}
          class={[
            "file-manager-dir__tree-item",
            unref(getIsActive) && "is-selected",
            props.indent && "is-indent",
            unref(isDragIn) && "dragging-in",
          ]}
          onDrop={handleFileDrop}
          ref={(ref) => (elementRef.value = ref as any)}
          onContextmenu={onContextMenu}
        >
          <DirIcon class="file-manager-dir__tree-item-icon" />
          <div class="file-manager-dir__tree-item-name">
            {renderDirRenameInput(props.data[label])}
          </div>
          {props.data[children]?.length && (
            <span
              onClick={handleExpandToggle}
              class={[
                "file-manager-dir__tree-item-expand",
                unref(getIsExpand) && "is-expand",
              ]}
            >
              <NIcon size={14}>
                <CaretRightOutlined />
              </NIcon>
            </span>
          )}
        </div>
        <>
          {unref(getIsExpand) && (
            <>
              {unref(props.data[children]).map((d: Record<string, any>) => (
                <DirTreeItem
                  indent
                  data={d}
                  parentList={props.data[children]}
                  parent={props.data}
                />
              ))}
            </>
          )}
        </>
      </>
    );
  },
});
