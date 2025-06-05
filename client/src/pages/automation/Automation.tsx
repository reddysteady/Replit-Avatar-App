import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";

interface AutomationRule {
  id: number;
  name: string;
  enabled: boolean;
  triggerType: string;
  triggerKeywords: string[];
  action: string;
  responseTemplate?: string;
}

const Automation = () => {
  const { toast } = useToast();
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [newRule, setNewRule] = useState<Omit<AutomationRule, "id">>({
    name: "",
    enabled: true,
    triggerType: "keywords",
    triggerKeywords: [],
    action: "auto_reply",
    responseTemplate: "",
  });
  const [newKeyword, setNewKeyword] = useState("");
  const [isAddingRule, setIsAddingRule] = useState(false);

  const { data: rules = [], isLoading } = useQuery<AutomationRule[]>({
    queryKey: ["/api/automation/rules"],
  });

  const updateRuleMutation = useMutation({
    mutationFn: async (rule: AutomationRule) => {
      return apiRequest("PUT", `/api/automation/rules/${rule.id}`, rule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
      toast({
        title: "Rule updated",
        description: "Your automation rule has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update rule",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addRuleMutation = useMutation({
    mutationFn: async (rule: Omit<AutomationRule, "id">) => {
      return apiRequest("POST", "/api/automation/rules", rule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
      setIsAddingRule(false);
      setNewRule({
        name: "",
        enabled: true,
        triggerType: "keywords",
        triggerKeywords: [],
        action: "auto_reply",
        responseTemplate: "",
      });
      toast({
        title: "Rule created",
        description: "Your new automation rule has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create rule",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: number) => {
      return apiRequest("DELETE", `/api/automation/rules/${ruleId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
      setSelectedRule(null);
      toast({
        title: "Rule deleted",
        description: "The automation rule has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete rule",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddKeyword = () => {
    if (newKeyword.trim() && selectedRule) {
      const updatedRule = {
        ...selectedRule,
        triggerKeywords: [...selectedRule.triggerKeywords, newKeyword.trim()],
      };
      setSelectedRule(updatedRule);
      setNewKeyword("");
    } else if (newKeyword.trim() && isAddingRule) {
      setNewRule({
        ...newRule,
        triggerKeywords: [...newRule.triggerKeywords, newKeyword.trim()],
      });
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    if (selectedRule) {
      const updatedRule = {
        ...selectedRule,
        triggerKeywords: selectedRule.triggerKeywords.filter(k => k !== keyword),
      };
      setSelectedRule(updatedRule);
    } else if (isAddingRule) {
      setNewRule({
        ...newRule,
        triggerKeywords: newRule.triggerKeywords.filter(k => k !== keyword),
      });
    }
  };

  const handleSaveRule = () => {
    if (selectedRule) {
      updateRuleMutation.mutate(selectedRule);
    }
  };

  const handleCreateRule = () => {
    addRuleMutation.mutate(newRule);
  };

  const handleDeleteRule = (ruleId: number) => {
    deleteRuleMutation.mutate(ruleId);
  };

  if (isLoading) {
    return (
      <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none md:pt-0 pt-16">
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl font-bold mb-6">Automation Rules</h2>
          <div className="animate-pulse">
            <div className="h-12 bg-neutral-200 rounded mb-6"></div>
            <div className="h-64 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none md:pt-0 pt-16">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
              Automation Rules
            </h2>
            <Button 
              onClick={() => {
                setIsAddingRule(true);
                setSelectedRule(null);
              }}
              disabled={isAddingRule}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Rule List */}
            <div className="col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Your Rules</CardTitle>
                  <CardDescription>
                    Click on a rule to edit its settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rules.length === 0 ? (
                    <div className="text-center py-4 text-neutral-500">
                      No rules created yet
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {rules.map((rule) => (
                        <li 
                          key={rule.id}
                          className={`p-3 rounded-md cursor-pointer flex items-center justify-between ${
                            selectedRule?.id === rule.id 
                              ? "bg-primary-50 border border-primary-200" 
                              : "hover:bg-neutral-50 border border-transparent"
                          }`}
                          onClick={() => {
                            setSelectedRule(rule);
                            setIsAddingRule(false);
                          }}
                        >
                          <div>
                            <p className="font-medium truncate">{rule.name}</p>
                            <p className="text-xs text-neutral-500">
                              {rule.action === "auto_reply" ? "Auto-reply" : "Route to human"}
                            </p>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${rule.enabled ? "bg-success" : "bg-neutral-300"}`}></div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Rule Editor */}
            <div className="col-span-1 md:col-span-2">
              {selectedRule && (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Rule</CardTitle>
                    <CardDescription>
                      Customize how this automation rule works
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input
                        id="rule-name"
                        value={selectedRule.name}
                        onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })}
                        placeholder="E.g., Reply to pricing questions"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rule-enabled">Enabled</Label>
                      <Switch
                        id="rule-enabled"
                        checked={selectedRule.enabled}
                        onCheckedChange={(checked) => setSelectedRule({ ...selectedRule, enabled: checked })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Trigger Keywords</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedRule.triggerKeywords.map((keyword) => (
                          <div key={keyword} className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md text-sm flex items-center">
                            {keyword}
                            <button 
                              className="ml-2 text-neutral-500 hover:text-neutral-700"
                              onClick={() => handleRemoveKeyword(keyword)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          placeholder="Add keyword..."
                          className="flex-grow"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                        />
                        <Button onClick={handleAddKeyword} size="sm">Add</Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="action-type">Action</Label>
                      <select
                        id="action-type"
                        value={selectedRule.action}
                        onChange={(e) => setSelectedRule({ ...selectedRule, action: e.target.value })}
                        className="w-full rounded-md border border-neutral-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="auto_reply">Auto-reply with template</option>
                        <option value="route_human">Route to human for review</option>
                        <option value="add_airtable">Add to Airtable as lead</option>
                      </select>
                    </div>
                    
                    {selectedRule.action === "auto_reply" && (
                      <div className="space-y-2">
                        <Label htmlFor="response-template">Response Template</Label>
                        <Textarea
                          id="response-template"
                          value={selectedRule.responseTemplate || ""}
                          onChange={(e) => setSelectedRule({ ...selectedRule, responseTemplate: e.target.value })}
                          placeholder="Enter your response template here. Use {{name}} to include the sender's name."
                          rows={6}
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="destructive"
                      onClick={() => handleDeleteRule(selectedRule.id)}
                      disabled={updateRuleMutation.isPending || deleteRuleMutation.isPending}
                    >
                      Delete Rule
                    </Button>
                    <Button 
                      onClick={handleSaveRule}
                      disabled={updateRuleMutation.isPending || deleteRuleMutation.isPending}
                    >
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {isAddingRule && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Rule</CardTitle>
                    <CardDescription>
                      Set up a new automation rule
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-rule-name">Rule Name</Label>
                      <Input
                        id="new-rule-name"
                        value={newRule.name}
                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                        placeholder="E.g., Reply to pricing questions"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="new-rule-enabled">Enabled</Label>
                      <Switch
                        id="new-rule-enabled"
                        checked={newRule.enabled}
                        onCheckedChange={(checked) => setNewRule({ ...newRule, enabled: checked })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Trigger Keywords</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {newRule.triggerKeywords.map((keyword) => (
                          <div key={keyword} className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md text-sm flex items-center">
                            {keyword}
                            <button 
                              className="ml-2 text-neutral-500 hover:text-neutral-700"
                              onClick={() => handleRemoveKeyword(keyword)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          placeholder="Add keyword..."
                          className="flex-grow"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                        />
                        <Button onClick={handleAddKeyword} size="sm">Add</Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-action-type">Action</Label>
                      <select
                        id="new-action-type"
                        value={newRule.action}
                        onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                        className="w-full rounded-md border border-neutral-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="auto_reply">Auto-reply with template</option>
                        <option value="route_human">Route to human for review</option>
                        <option value="add_airtable">Add to Airtable as lead</option>
                      </select>
                    </div>
                    
                    {newRule.action === "auto_reply" && (
                      <div className="space-y-2">
                        <Label htmlFor="new-response-template">Response Template</Label>
                        <Textarea
                          id="new-response-template"
                          value={newRule.responseTemplate || ""}
                          onChange={(e) => setNewRule({ ...newRule, responseTemplate: e.target.value })}
                          placeholder="Enter your response template here. Use {{name}} to include the sender's name."
                          rows={6}
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => setIsAddingRule(false)}
                      disabled={addRuleMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateRule}
                      disabled={addRuleMutation.isPending || !newRule.name.trim()}
                    >
                      Create Rule
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {!selectedRule && !isAddingRule && (
                <div className="h-full flex items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-300 p-12">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">No rule selected</h3>
                    <p className="text-neutral-500 mb-4">Select a rule to edit it or create a new one</p>
                    <Button
                      onClick={() => setIsAddingRule(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Rule
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Automation;
